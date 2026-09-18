"""
Testes de calculate_pokemon_stats (decisão 14 da V3):

  Stat = floor(((2 x Base + 31) x Nivel / 100) + 5)

Com IV=31, EV=0 e Nature neutra fixos por regra do projeto. Testados de
forma isolada do damage_calculator (decisão 6), sem depender de nenhum
dado real de Pokémon — só a aritmética da fórmula, calculada à mão em
cada caso abaixo.
"""
from app.core.stats import calculate_pokemon_stats


class TestCalculatePokemonStats:
    def test_base_100_nivel_100(self):
        # (2*100+31)=231; 231*100/100=231; +5=236
        assert calculate_pokemon_stats(base_stat=100, level=100) == 236

    def test_base_50_nivel_50(self):
        # (2*50+31)=131; 131*50/100=65.5; +5=70.5; floor=70
        assert calculate_pokemon_stats(base_stat=50, level=50) == 70

    def test_base_0_nivel_1(self):
        # (2*0+31)=31; 31*1/100=0.31; +5=5.31; floor=5
        assert calculate_pokemon_stats(base_stat=0, level=1) == 5

    def test_base_100_nivel_1(self):
        # (2*100+31)=231; 231*1/100=2.31; +5=7.31; floor=7
        assert calculate_pokemon_stats(base_stat=100, level=1) == 7

    def test_base_maximo_255_nivel_100(self):
        # (2*255+31)=541; 541*100/100=541; +5=546
        assert calculate_pokemon_stats(base_stat=255, level=100) == 546

    def test_retorna_sempre_um_inteiro(self):
        result = calculate_pokemon_stats(base_stat=77, level=63)
        assert isinstance(result, int)
