const express = require('express');  // Requerir el módulo Express
const mysql = require('mysql');  // Requerir el módulo MySQL para conectar a la base de datos
const QRCode = require('qr-image');  // Requerir el módulo qr-image para generar códigos QR
const fs = require('fs');  // Requerir el módulo fs para manipular el sistema de archivos
const path = require('path');  // Requerir el módulo path para trabajar con rutas de archivos
const multer = require('multer');  // Requerir el módulo multer para manejar archivos subidos
const sharp = require('sharp');  // Requerir el módulo sharp para manipulación de imágenes
const dns = require('dns');  // Requerir el módulo dns para resolver nombres de dominio
const app = express();  // Crear una aplicación Express
const upload = multer({ dest: 'uploads/' });  // Configurar multer para subir archivos al directorio 'uploads/'

// Configuración de la base de datos
let conexion;
try {
    /*conexion = mysql.createConnection({
        host: '3.128.217.142',  // Host de la base de datos
        database: 'tecnoparquebucar_Ra_web',  // Nombre de la base de datos
        user: 'tecnoparquebucar_Ra_web',  // Usuario de la base de datos
        password: '*1c!n~E]L6YN'  // Contraseña de la base de datos
    });*/
    conexion = mysql.createConnection({
        host: 'localhost',  // Host de la base de datos
        database: 'realidad_aumentada',  // Nombre de la base de datos
        user: 'root',  // Usuario de la base de datos
        password: ''  // Contraseña de la base de datos
    });
    

    conexion.connect((err) => {  
        if (err) {
            console.error('Error al conectar a la base de datos:', err);
            process.exit(1);  // Terminar el proceso si no se puede conectar a la base de datos
        } else {
            console.log('Conectado a la base de datos MySQL');
        }
    });
} catch (error) {
    console.error('Error al configurar la conexión a la base de datos:', error);
    process.exit(1);  // Terminar el proceso si hay un error en la configuración de la conexión
}

// Middleware
app.set('views', path.join(__dirname, 'views'));  // Configurar el directorio de vistas

app.use(express.json());  // Middleware para parsear JSON
app.use(express.urlencoded({ extended: false }));  // Middleware para parsear URL encoded data

app.use('/assets', express.static(path.join(__dirname, 'assets')));  // Servir archivos estáticos desde el directorio 'assets'


// Función para validar si un string es un número
function esNumero(val) {
    return /^\d+$/.test(val);  // Retorna true si el valor es un número
}

// Rutas


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Registro.html','index.html'));  // Enviar archivo HTML
});



app.post('/validar', upload.single('image'), (req, res) => {
    const datos = req.body;  // Obtener datos del cuerpo de la solicitud
    const cedula = datos.ced;  // Obtener la cédula del cuerpo de la solicitud
    const tipo = datos.ti_do;  // Obtener el tipo de documento del cuerpo de la solicitud
    const nombre = datos.nom;  // Obtener el nombre del cuerpo de la solicitud
    const telefono = datos.tel;  // Obtener el teléfono del cuerpo de la solicitud
    const descrp = datos.des;  // Obtener la descripción del cuerpo de la solicitud
    const profesion = datos.pro;  // Obtener la profesión del cuerpo de la solicitud
    const email = datos.email;  // Obtener el email del cuerpo de la solicitud
    const patrocinador = datos.pat;  // Obtener el patrocinador del cuerpo de la solicitud

    // Validación de que cédula y teléfono solo contengan números
    if (!esNumero(cedula)) {
        return res.status(400).json({ success: false, message: 'Cédula debe contener solo números' });  // Retornar error si la cédula no es un número
    }
    if (!esNumero(telefono)) {
        return res.status(400).json({ success: false, message: 'Teléfono debe contener solo números' });  // Retornar error si el teléfono no es un número
    }

    let buscar = "SELECT * FROM Invitados WHERE Cedula = ?";  // Consulta SQL para buscar un invitado por cédula
    conexion.query(buscar, [cedula], function(error, row) {
        if (error) {
            res.status(500).json({ success: false, message: 'Error en la base de datos' }); 
            console.error(error); // Retornar error si hay un problema con la base de datos
        } else {
            if (row.length > 0) {
                console.log("Usuario existente");
                res.status(400).json({ success: false, message: 'Usuario existente' });  // Retornar error si el usuario ya existe
            } else {
                const qrData = `http://localhost:3000/invitado/${cedula}`;  // Datos para el QR code
                const qr_svg = QRCode.imageSync(qrData, { type: 'png', margin: 1, ec_level: 'H', color: { dark: '#000000', light: '#00FFFF' } });  // Generar el QR code
                const imagpath = path.join(__dirname, 'assets');  // Ruta para almacenar el QR code

                if (!fs.existsSync(imagpath)) {
                    fs.mkdirSync(imagpath);  // Crear el directorio si no existe
                }

                const tempQrCodePath = path.join(imagpath, cedula + '_temp.png');  // Ruta temporal para el QR code
                const resizedQrCodePath = path.join(imagpath, cedula + '_resized.png');  // Ruta para el QR code redimensionado
                const qrCodeWithFramePath = path.join(imagpath, cedula + '.png');  // Ruta final para el QR code con marco
                fs.writeFileSync(tempQrCodePath, qr_svg);  // Guardar el QR code temporal

                sharp(tempQrCodePath)
                    .resize(600, 600)  // Redimensionar el QR code
                    .toFile(resizedQrCodePath, (err) => {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ success: false, message: 'Error al redimensionar el QR code' });  // Retornar error si hay un problema al redimensionar el QR code
                        } else {
                            const framePath = path.join(imagpath, 'frame.jpeg');  // Ruta del marco para el QR code

                            sharp(framePath)
                                .composite([{ input: resizedQrCodePath, gravity: 'south' }])  // Añadir el QR code redimensionado al marco
                                .toFile(qrCodeWithFramePath, (err, info) => {
                                    if (err) {
                                        console.error(err);
                                        res.status(500).json({ success: false, message: 'Error al crear la imagen con el marco' });  // Retornar error si hay un problema al crear la imagen con el marco
                                    } else {
                                        console.log("QR code with frame saved successfully");
                                        fs.unlinkSync(tempQrCodePath);  // Eliminar el archivo temporal
                                        fs.unlinkSync(resizedQrCodePath);  // Eliminar el archivo redimensionado

                                        let CONSULTA = "INSERT INTO Invitados(Cedula,Tipodocumento,Nombre,Telefono,Descripcion,Profesion,Email,Patrocinador) VALUES (?,?,?,?,?,?,?,?)";  // Consulta SQL para insertar un nuevo invitado
                                        conexion.query(CONSULTA, [cedula, tipo, nombre, telefono, descrp, profesion, email, patrocinador], function(error) {
                                            if (error) {
                                                console.error(error);
                                                res.status(500).json({ success: false, message: 'Error al almacenar los datos en la base de datos' });  // Retornar error si hay un problema al almacenar los datos
                                            } else {
                                                console.log("Datos almacenados correctamente");
                                                res.status(200).json({ success: true, message: 'Datos almacenados correctamente' });  // Retornar éxito si los datos se almacenaron correctamente
                                            }
                                        });
                                    }
                                });
                        }
                    });
            }
        }
    });
});

app.get('/invitado/:cedula', (req, res) => {
    const cedula = req.params.cedula;  // Obtener la cédula de los parámetros de la solicitud
    let buscar = "SELECT * FROM Invitados WHERE Cedula = ?";  // Consulta SQL para buscar un invitado por cédula

    conexion.query(buscar, [cedula], function(error, rows) {
        if (error) {
            console.error(error);
            res.status(500).send("Error al recuperar los datos del invitado");  // Retornar error si hay un problema al recuperar los datos
        } else {
            if (rows.length > 0) {
                const invitado = rows[0];  // Obtener el primer resultado de la consulta
                res.render('invitado', { invitado });  // Renderizar la vista 'invitado' con los datos del invitado
            } else {
                res.status(404).send("Invitado no encontrado");  // Retornar error si el invitado no se encuentra
            }
        }
    });
});

app.get('/api/email/:cedula', (req, res) => {
    const cedula = req.params.cedula;

    const query = 'SELECT email FROM Invitados WHERE Cedula = ?';
    conexion.query(query, [cedula], (error, results) => {
        if (error) {
            console.error('Error al obtener el correo:', error);
            res.status(500).send('Error al obtener el correo');
            return;
        }

        if (results.length > 0) {
            res.json({ email: results[0].email });
        } else {
            res.status(404).send('Correo no encontrado');
        }
    });
});

// Iniciar el servidor
app.listen(3000, function(){
    console.log("servidor creado http://localhost:3000");  // Mensaje en consola cuando el servidor está iniciado
});
