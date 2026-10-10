import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const source = process.argv[2];
if (!source) throw new Error('Informe a pasta das imagens como argumento.');
await mkdir('public/images/resources',{recursive:true});
const covers = [['arturo_anez-words-7550707_1920.jpg','caca-palavras'],['wokandapix-explore-1945678_1920.jpg','imagem-interativa'],['wokandapix-scrabble-7708848_1920.jpg','quebra-cabeca']];
for (const [file,slug] of covers) { const result = await sharp(join(source,file)).resize(960,600,{fit:'cover'}).webp({quality:80}).toFile('public/images/resources/'+slug+'.webp'); console.log(slug, result.size); }
