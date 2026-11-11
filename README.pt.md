<p align="center"><a href="README.md">English</a> · <b>Português</b></p>

# Pine3 Homeview

Um painel de parede para Home Assistant. Junta a ideia de "faces" de um ecrã de casa (deslizar
entre ecrãs inteiros, cada um com uma só função, legíveis do outro lado da sala) à base do
[Pine3 View](https://github.com/pinheirofilipem-ux/pine3-view): a casa constrói-se sozinha a partir das
áreas, dispositivos e entidades do Home Assistant, com cartões completos e a Casa 3D.
Código original, feito de raiz.

Ecrã principal: um Samsung Galaxy Tab A7 deitado na parede, com a app
[Pine3 Wallpanel](https://github.com/pinheirofilipem-ux/wallpanel-android).

> **Estado: em desenvolvimento (0.1.x).** Por agora é o painel do Pine3 View com outro nome, para poder
> ser instalado ao lado do Pine3 View. Os faces chegam nas próximas fases. O plano, com maquetes, está em
> [`docs/plano.html`](docs/plano.html).

## Faces
Desliza para o lado no início para mudar de face (ou usa os pontos por cima da dock, ou as setas do teclado).
O tablet abre no face inicial (o Painel) e volta a ele quando tocas na Casa da dock. Depois de algum tempo
sem toques (5 min por defeito) aparece o face ambiente, escurecido e sem a dock; um toque acorda-o.
Escolhe os faces, a ordem, o face inicial e o face ambiente em **Definições → Início**.

Já disponíveis:
- **Painel**: relógio e estado da casa à esquerda; chips de estado (Clima, Luzes, Segurança, Aspirador, A tocar), Favoritos, cenas e divisões à direita. Põe ou tira um Favorito com a estrela na folha de detalhe de cada dispositivo, ou no modo de edição (✎).
- **Mosaico**: grelha 4×3 de tiles grandes (S 1×1, M 2×1, L 2×2), preenchida sozinha até a editares. No modo de edição arrastas, tiras (−), mudas o tamanho (S/M/L) e adicionas dispositivos, o relógio digital ou analógico e a meteorologia. Toque liga e desliga; toque longo abre o detalhe.
- **Relógio**: hora grande, data, tempo e luzes acesas.

- **Mosaico+**: o mesmo motor do Mosaico, a começar com a meteorologia (e avisos IPMA), a agenda de hoje, o que está a tocar, cenas e favoritos.
- **Relógio e agenda**: dia da semana e mês, o mês inteiro com os dias que têm eventos, a agenda de hoje (eventos e lembretes), o que está a tocar, um relógio analógico, nascer e pôr do sol e o tempo. Também pode ser o face ambiente.

A agenda lê as entidades `calendar.*` e `todo.*` do Home Assistant. Os calendários do iCloud entram com a integração **CalDAV** (com uma palavra-passe específica de app); os Lembretes do iCloud costumam não estar disponíveis por CalDAV, por isso podes usar uma lista local do Home Assistant. Escolhe os calendários e a lista em **Definições → Início → Agenda**.

- **Casa 3D**: a vista 3D da casa como face (em tablets mais fracos, a Imagem 3D).
- **Fotografias**: moldura digital com as fotografias de uma pasta de media do Home Assistant (`/media`), com a hora, a data e o tempo por cima. Escolhe a pasta e o tempo de cada fotografia em **Definições → Início → Fotografias**.
- **Fluxo**: formas de vidro em movimento lento, com a hora; afastam-se quando passas o dedo.

Fotografias, Relógio, Relógio e agenda e Fluxo podem ser o face ambiente. A Casa 3D, as Fotografias e o Fluxo vêm desligados: liga-os em **Definições → Início → Faces**.

### Previstos
- **Painel** (face inicial): o ecrã principal do Pine3 com chips de estado e Favoritos.
- **Mosaico**: grelha 4×3 de tiles grandes (S 1×1, M 2×1, L 2×2).
- **Mosaico+**: meteo com avisos IPMA, agenda do dia, o que está a tocar, cenas.
- **Relógio e agenda**: data, mês, nascer do sol e meteo, para ler de longe.
- **Fluxo**: face ambiente animado.

## Instalar com o HACS
1. **HACS** → **⋮** → **Repositórios personalizados**: `https://github.com/pinheirofilipem-ux/Pine3-Homeview`, tipo **Integração**.
2. Descarrega o **Pine3 Homeview** e reinicia o Home Assistant.
3. **Definições → Dispositivos e serviços → Adicionar integração → Pine3 Homeview**.
4. Abre o **Pine3 Homeview** na barra lateral (`/pine3-homeview`; junta `?kiosk` para esconder a barra).

Requer Home Assistant 2024.7 ou mais recente. Usa o seu próprio domínio (`pine3_homeview`), definições
e opções por dispositivo, por isso não interfere com um Pine3 View instalado.

## Organização do código
`custom_components/pine3_homeview/frontend/`:
- `pine3-homeview-panel.js`: o elemento do painel (ciclo de vida, dados, desenho).
- `model.js`: divisões e funções por entidade. `util.js`: funções partilhadas.
- `views/`: ecrãs da casa, divisões, definições e previsão. `ui/`: tiles, cartão de detalhe, dock, modo de edição, opções do dispositivo, eventos.
- `tokens.js`: tokens de cor para os temas escuro e claro (o `theme.js` junta os claros nos temas claros).
- `styles.js`, `house3d.js`, `plan2d.js`, `housecanvas.js`, `weather.js`, `i18n.js`, `const.js`: como no Pine3 View.

Em tablets com até 4 GB de memória (como o Galaxy Tab A7) o painel usa "vidro leve" por defeito:
sem desfoque, com um preenchimento mais denso e um brilho mais forte. Muda-se por dispositivo nas Definições.

## Testes
```
pip install -r requirements_test.txt
pytest
```

## Licença
MIT (ver `LICENSE`). As fontes Outfit e Figtree estão sob a SIL Open Font License 1.1 (ver `NOTICE`).
