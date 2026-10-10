/** Decode and resize locally. The original file never leaves the device. */
export async function readLocalImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Escolha uma imagem de até 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const ratio = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.6, 0.4]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= 100_000) return data;
    }
    throw new Error("Esta imagem ficou grande demais. Escolha uma imagem mais simples.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("imagem")) throw error;
    throw new Error("Não foi possível abrir esta imagem. Tente outro arquivo.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
