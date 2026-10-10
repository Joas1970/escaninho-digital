# Caça-palavras no Escaninho

Publicado em /atividades/caca-palavras/, como uma ilha React do Astro, sem servidor de aplicação, contas ou banco de dados.

O módulo src/features/caca-palavras foi integrado a partir de Joas1970/caca-palavras-escaninho a pedido do proprietário. O repositório original permanece preservado. Atualizações nesse repositório não são sincronizadas automaticamente: revisar e trazer apenas os componentes e bibliotecas do jogo, mantendo imports relativos e os testes.

Os estilos Tailwind só são importados pela página do jogo e só examinam seu módulo. As demais páginas continuam com seus estilos existentes.

A biblioteca fica no localStorage do domínio. Links compartilhados codificam a atividade no fragmento #atividade= e conservam o endereço desta página. Nome e turma são usados na impressão e não entram no link. Imagens são reduzidas localmente. Não há coleta de resultados.

Verificar: gerar grade, selecionar palavras, persistência após recarregar, compartilhamento em outro navegador, imagem, QR code, impressão A4 e celular. Executar npm run build e npm run test:caca-palavras.

Capas fornecidas pelo proprietário em D:\\imagens-para-conteudo: arturo_anez-words-7550707_1920.jpg (caça-palavras), wokandapix-explore-1945678_1920.jpg (imagem interativa), wokandapix-scrabble-7708848_1920.jpg (quebra-cabeça). Versões WebP em public/images/resources.
