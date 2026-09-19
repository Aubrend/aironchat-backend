const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const MAX_TEXT = 60000;

// Carrega pdf-parse de forma robusta (o pacote exporta de maneiras diferentes)
function getPdfParser() {
  let mod;
  try { mod = require('pdf-parse/lib/pdf-parse.js'); }
  catch { mod = require('pdf-parse'); }

  // Pode ser: função direta, ou { default: fn }, ou { pdf: fn }
  if (typeof mod === 'function') return mod;
  if (mod && typeof mod.default === 'function') return mod.default;
  if (mod && typeof mod.pdf === 'function') return mod.pdf;
  throw new Error('pdf-parse não devolveu uma função válida');
}

async function extractText(file) {
  const name = (file.originalname || '').toLowerCase();
  const mime = file.mimetype || '';

  // PDF
  if (name.endsWith('.pdf') || mime === 'application/pdf') {
    const pdfParse = getPdfParser();
    const data = await pdfParse(file.buffer);
    return (data.text || '').trim();
  }

  // DOCX
  if (name.endsWith('.docx') || mime.includes('wordprocessingml')) {
    let mammoth;
    try { mammoth = require('mammoth'); }
    catch { throw new Error('Suporte DOCX indisponível no servidor'); }
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return (result.value || '').trim();
  }

  // TXT / MD / CSV / JSON / HTML
  if (
    name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.markdown') ||
    name.endsWith('.csv') || name.endsWith('.json') || name.endsWith('.html') ||
    mime.startsWith('text/') || mime === 'application/json'
  ) {
    return file.buffer.toString('utf-8').trim();
  }

  throw new Error('Formato não suportado. Usa PDF, DOCX, TXT, MD, CSV, JSON ou HTML.');
}

exports.upload = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado' });

      let text;
      try {
        text = await extractText(req.file);
      } catch (err) {
        console.error('extractText erro:', err.message);
        return res.status(400).json({ error: err.message });
      }

      if (!text || text.length < 3) {
        return res.status(400).json({ error: 'Não foi possível extrair texto do ficheiro' });
      }

      const truncated = text.length > MAX_TEXT;
      const finalText = truncated ? text.slice(0, MAX_TEXT) : text;

      res.json({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        length: text.length,
        truncated,
        text: finalText,
      });
    } catch (err) {
      console.error('Erro no upload:', err);
      res.status(500).json({ error: 'Erro ao processar documento' });
    }
  },
];