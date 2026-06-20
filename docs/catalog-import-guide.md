# Guia de Importação de Catálogo

Este guia detalha o formato esperado do arquivo CSV para importação do catálogo de figurinhas no StickerTrack.

## Regras Gerais
1. O arquivo não deve conter comentários, apenas a linha de cabeçalho obrigatória seguida pelos dados.
2. Nomes e textos não devem conter o caractere especial de igualdade `=` ou similares que configurem fórmulas no início do texto (proteção contra injeção em planilhas).
3. Todas as 19 colunas listadas no template são obrigatórias na estrutura, mas algumas podem ter valor vazio dependendo do tipo da figurinha.

## Colunas e Valores

- `collection_slug`: Identificador único da coleção (ex: `world-cup-2026`). Letras minúsculas e hífens apenas.
- `collection_name_*`: Nome da coleção nos 3 idiomas (ex: `Copa do Mundo 2026`, `World Cup 2026`, `Copa del Mundo 2026`).
- `section_code`: Código único da seção, normalmente o acrônimo do país ou categoria (ex: `BRA`, `FWC`).
- `section_type`: Categoria estrutural da seção. Valores permitidos: `NATIONAL_TEAM`, `INTRODUCTION`, `STADIUMS`, `SPECIAL`, `OTHER`.
- `section_name_*`: Nome da seção/país nos idiomas correspondentes.
- `sticker_code`: Código alfanumérico que aparece impresso na figurinha (ex: `BRA 19`).
- `sticker_type`: Categoria visual da figurinha. Valores: `PLAYER`, `TEAM`, `BADGE`, `STADIUM`, `TROPHY`, `MASCOT`, `SPECIAL`, `OTHER`.
- `sticker_name_*`: Nome da figurinha. Para jogadores, será o nome do atleta (o mesmo nos 3 idiomas). Para itens genéricos, pode ser "Escudo", "Badge", "Escudo". *Aviso: Deixar traduções em branco gerará Warnings no sistema, e o nome será herdado de outro idioma.*
- `album_order`: Número inteiro representando a ordem cronológica e contínua da figurinha no álbum geral (posição de 1 a N).
- `section_order`: Número inteiro representando a ordem da figurinha dentro daquela seção específica (ex: de 1 a 20 dentro da seção do Brasil).
- `player_name`: Obrigatório para figurinhas do tipo `PLAYER`. Usado pelo enriquecedor de dados.
- `country_iso2`: Código ISO de duas letras do país da figurinha (ex: `BR`, `NL`). Se a seção não for de país, deixe em branco.
- `wikidata_id`: Identificador Wikidata para enriquecimento de fotos e informações estruturadas (ex: `Q21535`). Opcional, porém altamente recomendado.

## Transição de Status
A importação real não torna a coleção visível imediatamente para usuários comuns.
Após rodar o script de importação e revisar, você deverá acessar o banco de dados (ou a interface administrativa quando existir) para alterar a transição:
`DRAFT` → `REVIEW` → `PUBLISHED`.
Usuários apenas veem coleções `PUBLISHED`.
