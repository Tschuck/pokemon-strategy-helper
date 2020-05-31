# Pokemonn Strategy Helper

NodeJS library that uses [pokeapi](https://pokeapi.co) as database, to get information of all pokemon, it's types and it's attacks. Includes several functionallities for helping you, to decide to build your perfect team.

Goals:
- [x] General data connector logic
- [x] Type average calculation
- [ ] Pokemon suggestion
- [ ] Attack suggestion
- [ ] Item suggestion
- [ ] Team suggestions

*It's in a very early stage and in a WIP state. So currently not that user friendly. Feel free to ask.*

## How to use
At first, please setup your environment. `setup-data` command will download all specific data from the pokeapi before using calculation logic, to reduce network load.

```
yarn
yarn setup-data
```

## Type average
Calculates the average of stats of pokemon with a specific type:

```
yarn stat-average
```

E.g. Only 27% of pokemon with the type electric have a higher defense than the average of all defense values.

``` 
┌─────────┬────────────┬───────┬─────────────┬─────────────────┬────────────────┬──────────────┬──────────────┬─────────────┐
│ (index) │    type    │ total │    speed    │ special-defense │ special-attack │   defense    │    attack    │     hp      │
├─────────┼────────────┼───────┼─────────────┼─────────────────┼────────────────┼──────────────┼──────────────┼─────────────┤
│    0    │  'grass'   │  95   │ '~59 | 28%' │   '~73 | 52%'   │  '~74 | 43%'   │ '~75 | 41%'  │ '~77 | 43%'  │ '~67 | 48%' │
│    1    │  'poison'  │  62   │ '~68 | 44%' │   '~70 | 40%'   │  '~70 | 32%'   │ '~65 | 27%'  │ '~72 | 32%'  │ '~65 | 39%' │
│    2    │   'bug'    │  78   │ '~66 | 40%' │   '~68 | 42%'   │  '~60 | 23%'   │ '~73 | 41%'  │ '~76 | 36%'  │ '~59 | 35%' │
│    3    │ 'electric' │  69   │ '~85 | 70%' │   '~69 | 46%'   │  '~82 | 54%'   │ '~65 | 30%'  │ '~71 | 28%'  │ '~59 | 36%' │
│    4    │ 'psychic'  │  97   │ '~79 | 59%' │   '~89 | 69%'   │  '~97 | 67%'   │ '~77 | 46%'  │ '~78 | 38%'  │ '~75 | 56%' │
│    5    │  'ground'  │  67   │ '~61 | 37%' │   '~67 | 45%'   │  '~63 | 30%'   │ '~89 | 66%'  │ '~93 | 60%'  │ '~77 | 60%' │
│    6    │  'steel'   │  57   │ '~62 | 35%' │   '~84 | 56%'   │  '~72 | 35%'   │ '~113 | 82%' │ '~97 | 68%'  │ '~67 | 49%' │
│    7    │  'flying'  │  116  │ '~87 | 66%' │   '~73 | 47%'   │  '~79 | 47%'   │ '~70 | 38%'  │ '~81 | 46%'  │ '~71 | 53%' │
│    8    │  'ghost'   │  57   │ '~66 | 40%' │   '~81 | 65%'   │  '~80 | 47%'   │ '~82 | 53%'  │ '~83 | 46%'  │ '~66 | 32%' │
│    9    │  'dragon'  │  55   │ '~83 | 71%' │   '~89 | 78%'   │  '~103 | 75%'  │ '~91 | 76%'  │ '~106 | 75%' │ '~89 | 78%' │
│   10    │   'fire'   │  66   │ '~76 | 55%' │   '~75 | 50%'   │  '~94 | 64%'   │ '~73 | 38%'  │ '~85 | 50%'  │ '~70 | 55%' │
│   11    │  'water'   │  132  │ '~65 | 35%' │   '~74 | 44%'   │  '~75 | 45%'   │ '~76 | 45%'  │ '~75 | 37%'  │ '~70 | 52%' │
│   12    │   'ice'    │  41   │ '~68 | 39%' │   '~78 | 54%'   │  '~79 | 51%'   │ '~78 | 54%'  │ '~83 | 41%'  │ '~77 | 63%' │
│   13    │  'normal'  │  108  │ '~72 | 51%' │   '~65 | 33%'   │  '~58 | 20%'   │ '~61 | 22%'  │ '~76 | 36%'  │ '~75 | 55%' │
│   14    │ 'fighting' │  58   │ '~79 | 55%' │   '~74 | 45%'   │  '~68 | 33%'   │ '~77 | 50%'  │ '~108 | 74%' │ '~76 | 64%' │
│   15    │   'dark'   │  59   │ '~77 | 56%' │   '~70 | 37%'   │  '~77 | 46%'   │ '~70 | 32%'  │ '~95 | 68%'  │ '~73 | 56%' │
│   16    │   'rock'   │  77   │ '~61 | 26%' │   '~76 | 44%'   │  '~64 | 26%'   │ '~100 | 69%' │ '~89 | 53%'  │ '~65 | 40%' │
│   17    │  'fairy'   │  53   │ '~69 | 49%' │   '~91 | 70%'   │  '~83 | 58%'   │ '~77 | 45%'  │ '~69 | 32%'  │ '~67 | 43%' │
└─────────┴────────────┴───────┴─────────────┴─────────────────┴────────────────┴──────────────┴──────────────┴─────────────┘
```