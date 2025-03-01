const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { parseXML } = require('./parser'); // Esta es la línea correcta

// Crear la aplicación de Express
const app = express();
const PORT = 5000;

// Permitir que React (el frontend) se comunique con este servidor
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.send('¡El servidor está funcionando!');
});

// Configuración de Multer para guardar los archivos en la carpeta "uploads"
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Ruta para subir el archivo XML, procesarlo y generar el DOCX
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('--- Archivo recibido en el backend ---');
    console.log('Archivo:', req.file);
    console.log('Materia:', req.body.materia);
    console.log('Tipo:', req.body.tipo);

    if (!req.file || !req.body.materia || !req.body.tipo) {
        console.error('Error: Faltan datos en la solicitud');
        return res.status(400).send('Faltan datos');
    }

    try {
        const filePath = path.join(__dirname, '..', req.file.path);
        console.log('Ruta del archivo:', filePath);

        const outputFileName = await parseXML(filePath, req.body.materia, req.body.tipo);
        console.log('Nombre del archivo generado:', outputFileName);

        res.download(outputFileName, (err) => {
            if (err) {
                console.error('Error al descargar el archivo:', err);
                res.status(500).send('Error al descargar el archivo');
            }
        });
    } catch (error) {
        console.error('Error en el procesamiento del archivo:', error);
        res.status(500).send('Error al procesar el archivo XML');
    }
});

// Iniciar el servidor en el puerto 5000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


// Servir los archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});
