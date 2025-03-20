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

        // Convertir el XML en un objeto JavaScript
        const parser = new xml2js.Parser({ explicitArray: false, attrkey: 'attr' });
        const parsedData = await parser.parseStringPromise(xmlData);

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
        const questions = Array.isArray(parsedData.quiz.question)
            ? parsedData.quiz.question
            : [parsedData.quiz.question];

        questions.forEach((q, index) => {
            if (!q.name || !q.questiontext) {
                console.warn(`La pregunta ${index + 1} no tiene nombre o texto. Se omitirá.`);
                return;
            }

            const name = q.name.text;
            const questionText = cleanHTML(q.questiontext.text);

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
                answers.forEach((answer) => {
                    const answerText = cleanHTML(answer.text);
                    
                    // Leer el atributo fraction
                    const fraction = answer.attr ? answer.attr.fraction : null;
                    console.log('Debug - Valor de fraction:', fraction);

                    const isCorrect = fraction == 100 || fraction === '100';
                    
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

        const buffer = await Packer.toBuffer(doc);
        const outputFileName = `generated/${materia}-${tipo}-${Date.now()}.docx`;

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
