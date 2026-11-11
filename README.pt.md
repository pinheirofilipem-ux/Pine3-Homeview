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

## Faces previstos
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

## Testes
```
pip install -r requirements_test.txt
pytest
```

## Licença
MIT (ver `LICENSE`). As fontes Outfit e Figtree estão sob a SIL Open Font License 1.1 (ver `NOTICE`).
