"""
Testes do motor de cálculo (damage_calculator) — port 1:1 dos 32 testes
de src/tests/damageCalculator.test.ts (V2, TypeScript/Vitest).

Critério de aceite da migração (decisão 7 da V3): estes testes passando
em Python é suficiente — sem infraestrutura extra de comparação
automática com o TS a cada execução.
"""
import math

import pytest

from app.core.damage_calculator import calculate_damage, round_final_damage
from app.core.models import Attacker, BattleModifiers, DamageInput, Defender, Move
from app.core.type_catalog import TYPE_IDS
from app.core.type_chart import TYPE_CHART
from app.core.validators import validate_battle_input


def make_attacker(**overrides) -> Attacker:
    base = dict(type1="fire", atk=20, sp_atk=20)
    base.update(overrides)
    return Attacker(**base)


def make_move(**overrides) -> Move:
    base = dict(type="fire", category="SPECIAL", power=40)
    base.update(overrides)
    return Move(**base)


def make_defender(**overrides) -> Defender:
    base = dict(type1="grass", def_=10, sp_def=10)
    base.update(overrides)
    return Defender(**base)


def make_modifiers(**overrides) -> BattleModifiers:
    base = dict(critical=False, multiplier=1)
    base.update(overrides)
    return BattleModifiers(**base)


def make_input(attacker=None, move=None, defender=None, modifiers=None) -> DamageInput:
    return DamageInput(
        attacker=make_attacker(**(attacker or {})),
        move=make_move(**(move or {})),
        defender=make_defender(**(defender or {})),
        modifiers=make_modifiers(**(modifiers or {})),
    )


class TestExemploOficial:
    """Exemplo oficial do documento de regras (Charmander vs Bulbasaur)."""

    def test_ember_critico_contra_grass_resulta_em_36_de_dano(self):
        input = make_input(
            attacker=dict(type1="fire", atk=0, sp_atk=20),
            move=dict(type="fire", category="SPECIAL", power=40),
            defender=dict(type1="grass", def_=0, sp_def=10),
            modifiers=dict(critical=True, multiplier=1),
        )
        result = calculate_damage(input)
        assert result.base_damage == 8
        assert result.stab_multiplier == 1.5
        assert result.effectiveness_multiplier == 2
        assert result.critical_multiplier == 1.5
        assert result.other_multiplier == 1
        assert result.final_damage == 36


class TestTeste1CalculoBasicoFisico:
    def test_usa_atk_def_para_golpes_fisicos(self):
        input = make_input(
            attacker=dict(type1="normal", atk=30, sp_atk=5),
            move=dict(type="normal", category="PHYSICAL", power=20),
            defender=dict(type1="rock", def_=15, sp_def=5),
        )
        result = calculate_damage(input)
        assert result.base_damage == 4  # (20/10) * (30/15)


class TestTeste2CalculoBasicoEspecial:
    def test_usa_spatk_spdef_para_golpes_especiais(self):
        input = make_input(
            attacker=dict(type1="water", atk=5, sp_atk=40),
            move=dict(type="water", category="SPECIAL", power=30),
            defender=dict(type1="rock", def_=5, sp_def=20),
        )
        result = calculate_damage(input)
        assert result.base_damage == 6  # (30/10) * (40/20)


class TestTeste3StabAtivado:
    def test_aplica_1_5_quando_tipo_do_golpe_bate_com_atacante(self):
        input = make_input(
            attacker=dict(type1="fire", type2="flying", atk=10, sp_atk=10),
            move=dict(type="fire", category="PHYSICAL", power=10),
        )
        assert calculate_damage(input).stab_multiplier == 1.5

    def test_nao_acumula_mesmo_com_dois_tipos_batendo(self):
        input = make_input(
            attacker=dict(type1="fire", type2="flying", atk=10, sp_atk=10),
            move=dict(type="fire", category="PHYSICAL", power=10),
        )
        assert calculate_damage(input).stab_multiplier == 1.5


class TestTeste4StabDesativado:
    def test_mantem_1_quando_tipo_nao_corresponde(self):
        input = make_input(
            attacker=dict(type1="water", type2="flying", atk=10, sp_atk=10),
            move=dict(type="fire", category="PHYSICAL", power=10),
        )
        assert calculate_damage(input).stab_multiplier == 1


class TestTeste5DefensorComUmTipo:
    def test_usa_apenas_multiplicador_do_tipo1(self):
        input = make_input(
            move=dict(type="water", category="SPECIAL", power=10),
            defender=dict(type1="fire"),
        )
        result = calculate_damage(input)
        assert result.effectiveness_multiplier == 2
        assert len(result.effectiveness_breakdown) == 1


class TestTeste6DefensorComDoisTiposEfetividade4x:
    def test_multiplica_os_dois_multiplicadores(self):
        input = make_input(
            move=dict(type="water", category="SPECIAL", power=10),
            defender=dict(type1="fire", type2="rock"),
        )
        result = calculate_damage(input)
        assert result.effectiveness_multiplier == 4
        assert [(e.defense_type, e.multiplier) for e in result.effectiveness_breakdown] == [
            ("fire", 2),
            ("rock", 2),
        ]


class TestTeste7DefensorComDoisTiposEfetividade025x:
    def test_multiplica_0_5_x_0_5(self):
        input = make_input(
            move=dict(type="water", category="SPECIAL", power=10),
            defender=dict(type1="water", type2="grass"),
        )
        assert calculate_damage(input).effectiveness_multiplier == 0.25


class TestTeste8Imunidade0x:
    def test_normal_vs_ghost_resulta_em_dano_final_0(self):
        input = make_input(
            attacker=dict(type1="normal", atk=50, sp_atk=5),
            move=dict(type="normal", category="PHYSICAL", power=50),
            defender=dict(type1="ghost", def_=1, sp_def=5),
        )
        result = calculate_damage(input)
        assert result.effectiveness_multiplier == 0
        assert result.final_damage == 0


class TestTeste9CriticoAtivado:
    def test_aplica_multiplicador_1_5(self):
        input = make_input(modifiers=dict(critical=True, multiplier=1))
        assert calculate_damage(input).critical_multiplier == 1.5


class TestTeste10CriticoDesativado:
    def test_mantem_multiplicador_1(self):
        input = make_input(modifiers=dict(critical=False, multiplier=1))
        assert calculate_damage(input).critical_multiplier == 1


class TestTeste11Modificador1:
    def test_nao_altera_dano_em_relacao_ao_padrao(self):
        input = make_input(modifiers=dict(critical=False, multiplier=1))
        with_default_multiplier = calculate_damage(
            make_input(modifiers=dict(critical=False, multiplier=None))
        )
        assert calculate_damage(input).final_damage == with_default_multiplier.final_damage


class TestTeste12Modificador2:
    def test_dobra_o_dano_final(self):
        base = calculate_damage(make_input(modifiers=dict(critical=False, multiplier=1)))
        doubled = calculate_damage(make_input(modifiers=dict(critical=False, multiplier=2)))
        assert doubled.final_damage == base.final_damage * 2


class TestTeste13Modificador0:
    def test_zera_o_dano_final(self):
        input = make_input(modifiers=dict(critical=False, multiplier=0))
        assert calculate_damage(input).final_damage == 0


class TestTeste14Atk0:
    def test_resulta_em_dano_base_0_para_golpe_fisico(self):
        input = make_input(
            attacker=dict(type1="normal", atk=0, sp_atk=10),
            move=dict(type="normal", category="PHYSICAL", power=40),
        )
        result = calculate_damage(input)
        assert result.base_damage == 0
        assert result.final_damage == 0


class TestTeste15Def0:
    def test_usa_defesa_efetiva_minima_de_1(self):
        input = make_input(
            move=dict(type="normal", category="PHYSICAL", power=10),
            defender=dict(type1="rock", def_=0, sp_def=10),
        )
        assert calculate_damage(input).effective_defense == 1


class TestTeste16DefModificadaAbaixoDe1:
    def test_mantem_defesa_efetiva_em_1(self):
        input = make_input(
            move=dict(type="normal", category="PHYSICAL", power=10),
            defender=dict(type1="rock", def_=2, sp_def=10, stat_modifiers={"def": -5}),
        )
        result = calculate_damage(input)
        assert result.defense_detail.modified == -3
        assert result.effective_defense == 1


class TestTeste17GolpeComPoder0:
    def test_nao_calcula_dano_ofensivo(self):
        input = make_input(move=dict(type="normal", category="PHYSICAL", power=0))
        result = calculate_damage(input)
        assert result.is_damaging_move is False
        assert result.base_damage == 0
        assert result.final_damage == 0


class TestTeste18AlteracaoAbsolutaDeAtributo:
    def test_aplica_modificacao_antes_do_calculo_do_dano_base(self):
        input = make_input(
            attacker=dict(type1="normal", atk=20, sp_atk=5, stat_modifiers={"atk": 5}),
            move=dict(type="normal", category="PHYSICAL", power=10),
            defender=dict(type1="normal", def_=10, sp_def=10),
        )
        result = calculate_damage(input)
        assert result.attack_detail.original == 20
        assert result.attack_detail.modified == 25
        assert result.effective_attack == 25
        assert result.base_damage == 2.5  # (10/10) * (25/10)


class TestTeste19Tipo2Vazio:
    def test_considera_atacante_defensor_de_tipo_unico(self):
        input = make_input(
            attacker=dict(type1="fire", type2=None, atk=10, sp_atk=10),
            defender=dict(type1="grass", type2=None, def_=10, sp_def=10),
        )
        assert len(calculate_damage(input).effectiveness_breakdown) == 1


class TestTeste20EntradaInvalida:
    def test_rejeita_atk_negativo(self):
        input = make_input(attacker=dict(type1="normal", atk=-5, sp_atk=10))
        validation = validate_battle_input(input)
        assert validation.valid is False
        assert any(e.field == "attacker.atk" for e in validation.errors)
        with pytest.raises(ValueError):
            calculate_damage(input)

    def test_rejeita_poder_negativo(self):
        input = make_input(move=dict(type="normal", category="PHYSICAL", power=-10))
        validation = validate_battle_input(input)
        assert validation.valid is False
        assert any(e.field == "move.power" for e in validation.errors)

    def test_rejeita_modificador_negativo(self):
        input = make_input(modifiers=dict(critical=False, multiplier=-1))
        validation = validate_battle_input(input)
        assert validation.valid is False
        assert any(e.field == "modifiers.multiplier" for e in validation.errors)

    def test_rejeita_tipo2_igual_ao_tipo1_no_atacante(self):
        input = make_input(attacker=dict(type1="fire", type2="fire", atk=10, sp_atk=10))
        validation = validate_battle_input(input)
        assert validation.valid is False
        assert any(e.field == "attacker.type2" for e in validation.errors)

    def test_rejeita_tipo_do_golpe_invalido(self):
        input = make_input(move=dict(type="plasma", category="PHYSICAL", power=10))
        validation = validate_battle_input(input)
        assert validation.valid is False
        assert any(e.field == "move.type" for e in validation.errors)

    def test_rejeita_categoria_invalida(self):
        input = make_input(move=dict(category="MENTAL"))
        validation = validate_battle_input(input)
        assert validation.valid is False
        assert any(e.field == "move.category" for e in validation.errors)


class TestArredondamento:
    def test_nao_arredonda_valores_intermediarios(self):
        input = make_input(
            attacker=dict(type1="water", atk=5, sp_atk=23),
            move=dict(type="water", category="SPECIAL", power=33),
            defender=dict(type1="fire", def_=5, sp_def=7),
        )
        result = calculate_damage(input)
        assert not result.base_damage.is_integer()
        assert float(result.final_damage).is_integer()
        assert result.final_damage >= 0

    def test_round_half_up_8_5_arredonda_para_9(self):
        assert round_final_damage(8.5) == 9
        assert round_final_damage(8.49) == 8

    def test_nunca_retorna_dano_negativo(self):
        assert round_final_damage(-3) == 0


class TestTypeChartConsistenciaDeDados:
    def test_possui_exatamente_os_18_tipos_como_linhas_e_colunas(self):
        assert len(TYPE_CHART) == 18
        for attack_type in TYPE_IDS:
            assert len(TYPE_CHART[attack_type]) == 18

    def test_confere_multiplicadores_chave_da_referencia(self):
        assert TYPE_CHART["water"]["fire"] == 2
        assert TYPE_CHART["water"]["rock"] == 2
        assert TYPE_CHART["water"]["grass"] == 0.5
        assert TYPE_CHART["normal"]["ghost"] == 0
        assert TYPE_CHART["fighting"]["ghost"] == 0
        assert TYPE_CHART["electric"]["ground"] == 0
        assert TYPE_CHART["dragon"]["fairy"] == 0
