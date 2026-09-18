"""
stats — fórmula de atributos por nível (decisão 14 da V3), isolada e
testada à parte do damage_calculator.py (decisão 6).

  Stat = floor(((2 x Base + 31) x Nível / 100) + 5)

Fórmula oficial dos jogos para atributos não-HP (Geração III+), com
IV = 31, EV = 0 e Nature neutra (multiplicador 1.0) fixos por regra do
projeto — esses três valores nunca aparecem na interface (decisão 13
da proposta original / item 5 do prompt mestre da V3).

Esta função opera sobre UM atributo por chamada (um base stat + nível
-> um stat final); o chamador (services/, na Etapa 6) a aplica a cada
um dos quatro atributos usados pelo motor (ATK, DEF, Sp. ATK, Sp. DEF).
HP não é calculado aqui porque não participa do cálculo de dano do RPG.
"""
import math


def calculate_pokemon_stats(base_stat: int, level: int) -> int:
    """
    Calcula um atributo (ATK, DEF, Sp. ATK ou Sp. DEF) para um dado
    nível, a partir do base stat oficial.

    :param base_stat: base stat oficial do Pokémon para o atributo (>= 0).
    :param level: nível do Pokémon (1-100).
    """
    return math.floor(((2 * base_stat + 31) * level / 100) + 5)
