import React, { useState } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";

function App() {
    const [file, setFile] = useState(null);
    const [materia, setMateria] = useState("");
    const [tipo, setTipo] = useState("final");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        // Validaciones
        if (!file) {
            setMessage("Por favor, seleccioná un archivo XML.");
            setLoading(false);
            return;
        }
        if (!file.name.endsWith(".xml")) {
            setMessage("El archivo debe tener formato XML.");
            setLoading(false);
            return;
        }
        if (!materia.trim()) {
            setMessage("Por favor, ingresá el nombre de la materia.");
            setLoading(false);
            return;
        }
        if (!tipo) {
            setMessage("Por favor, seleccioná el tipo (final o aula).");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("materia", materia);
        formData.append("tipo", tipo);

        try {
            const response = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: formData,
                headers: {
                    "Accept": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${materia}-${tipo}.docx`;
                link.click();
                window.URL.revokeObjectURL(url);
                setMessage("¡Archivo DOCX generado exitosamente!");
                // Limpiar el formulario
                setFile(null);
                setMateria("");
                setTipo("final");
            } else {
                setMessage("Error al procesar el archivo XML.");
            }
        } catch (error) {
            console.error("Error:", error);
            setMessage("Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <h1 className="text-center mb-4">Generador de Archivo DOCX</h1>
            {message && (
                <Alert variant="info" className="text-center">
                    {message}
                </Alert>
            )}
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Archivo XML:</Form.Label>
                    <Form.Control
                        type="file"
                        accept=".xml"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                    />
                </Form.Group>
                <Form.Group controlId="formMateria" className="mb-3">
                    <Form.Label>Materia:</Form.Label>
                    <Form.Control
                        type="text"
                        value={materia}
                        onChange={(e) => setMateria(e.target.value)}
                        placeholder="Ej. AES, Economía, Estadística"
                        required
                    />
                </Form.Group>
                <Form.Group controlId="formTipo" className="mb-3">
                    <Form.Label>Tipo:</Form.Label>
                    <Form.Select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <option value="final">Final</option>
                        <option value="aula">Aula</option>
                    </Form.Select>
                </Form.Group>
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />{" "}
                            Generando...
                        </>
                    ) : (
                        "Generar DOCX"
                    )}
                </Button>
            </Form>
        </Container>
    );
}

export default App;

