const fs = require('fs');
const xml2js = require('xml2js');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');

// Función para limpiar el HTML y dejar solo el texto
function cleanHTML(html) {
    return html
        .replace(/<[^>]+>/g, '') // Elimina todas las etiquetas HTML
        .replace(/&nbsp;/g, ' ')  // Reemplaza los espacios especiales por espacios normales
        .replace(/\s+/g, ' ')     // Reemplaza espacios múltiples por uno solo
        .trim();                  // Elimina espacios al inicio y final
}

// Función para leer el XML y generar el archivo DOCX
async function parseXML(filePath, materia, tipo) {
    try {
        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`El archivo no se encontró en la ruta: ${filePath}`);
        }

        // Leer el archivo XML
        console.log('Leyendo el archivo XML en:', filePath);
        const xmlData = fs.readFileSync(filePath, 'utf-8');
        console.log('Contenido bruto del archivo XML:', xmlData);

        // Convertir el XML en un objeto JavaScript
        const parser = new xml2js.Parser({ explicitArray: false });
        const parsedData = await parser.parseStringPromise(xmlData);
        console.log('Datos procesados:', JSON.stringify(parsedData, null, 2));

        // Verificar si el XML tiene la estructura esperada
        if (!parsedData.quiz || !parsedData.quiz.question) {
            throw new Error('El XML no tiene la estructura esperada.');
        }

        // Crear un array para almacenar las secciones del documento
        const sections = [];

        // Título del documento
        sections.push(
            new Paragraph({
                text: `Preguntas de ${materia} - ${tipo}`,
                heading: HeadingLevel.TITLE,
            })
        );

        // Procesar las preguntas
        const questions = parsedData.quiz.question;
        questions.forEach((q, index) => {
            console.log(`Procesando la pregunta ${index + 1}:`, JSON.stringify(q, null, 2));

            // Verificar que la pregunta tenga nombre y texto
            if (!q.name || !q.questiontext) {
                console.warn(`La pregunta ${index + 1} no tiene nombre o texto. Se omitirá.`);
                return;
            }

            const name = q.name.text;
            const questionText = cleanHTML(q.questiontext.text);

            // Agregar la pregunta al documento
            sections.push(
                new Paragraph({
                    text: `Nombre de la pregunta: ${name}`,
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph(`Pregunta: ${questionText}`)
            );

            // Procesar las respuestas
            if (q.answer) {
                const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
               answers.forEach((answer, answerIndex) => {
                const answerText = cleanHTML(answer.text);
                const isCorrect = answer.fraction === '100'; // solo '100' será correcto
                const answerTextWithIndicator = isCorrect
                ? `${answerText} (correcta)`
                : answerText;

                sections.push(
                    new Paragraph({
                        text: answerTextWithIndicator,
                    })
                );
            });
            }
        });

        // Crear el documento con todas las secciones
        const doc = new Document({
            creator: "Generador de Exámenes",
            title: `Preguntas de ${materia} - ${tipo}`,
            description: "Documento generado automáticamente desde un archivo XML",
            sections: [
                {
                    children: sections,
                },
            ],
        });

        // Generar el archivo .docx
        const buffer = await Packer.toBuffer(doc);
        const outputFileName = `generated/${materia}-${tipo}-${Date.now()}.docx`;

        // Crear la carpeta 'generated' si no existe
        if (!fs.existsSync('generated')) {
            fs.mkdirSync('generated');
        }

        fs.writeFileSync(outputFileName, buffer);
        console.log('Archivo DOCX generado:', outputFileName);

        return outputFileName;
    } catch (error) {
        console.error('Error en parseXML:', error);
        throw error;
    }
}

module.exports = { parseXML };


