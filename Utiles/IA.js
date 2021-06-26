var fs = require('fs');
var tf = require("@tensorflow/tfjs");
const model = tf.sequential();


model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
model.compile({ loss: "meanSquaredError", optimizer: "sgd" });

function exportar () {
		this.datos = []
		this.entrenando = false;
		this.tiempototal = 0;
		this.tiempoentrenamiento = 0;
		var nombreArchivo = './datosdeentrenamiento.txt'; 
		this.activarentrenamiento = (tiempo)=>
		{
			console.log("***** INICIANDO ENTRENAMIENTO DE ", tiempo / 60000, " MINUTOS *****")
			this.tiempoentrenamiento = tiempo;
			this.entrenando = true;
		}
		this.predecir = (valor)=>
		{
			var prediccion = model.predict(tf.tensor2d([valor], [1, 1])).dataSync();
			//console.log(model)
			return prediccion;
		}
		this.entrenar = (datos,tiempo) =>
		{
			if(this.entrenando == true)
			{
				datos = datos.map(a=>{return {t:tiempo, cant:a}})
				this.datos = this.datos.concat(datos)
				console.log(this.datos);
				this.tiempototal = this.tiempototal + tiempo;
		        if(this.tiempototal>this.tiempoentrenamiento)
		        {
		          this.entrenando = false;
		          console.log("terminó el entrenamiento");
		          
				  fs.unlink(nombreArchivo,(err)=>{console.log("no se encontró el archivo")});
		          fs.appendFile(nombreArchivo, JSON.stringify(this.datos), function (err) {
					  if (err) throw err;
					  console.log('Saved!');
					});
		        }	
			}
		}
		this.cargarModelo = () => {
			fs.readFile(nombreArchivo, (err, datos) => {
			  if (err) {
			    if (err.code === 'ENOENT') {
			      console.log('El archivo de entrenamiento no existe');
			      return;
			    }
			    throw err;
			  }
			  //console.log(datos)
				datos = JSON.parse(datos);
				var x = datos.map(a=>{return a.t/1000});
				var y = datos.map(a=>{return a.cant});
				console.log(x,y);
				const height = tf.tensor2d(x, [x.length, 1]);
				const weight = tf.tensor2d(y, [y.length, 1]);
				const learningRate = 0.00001;
				const optimizer = tf.train.sgd(learningRate);

				model.compile({
					loss: 'meanSquaredError',
					optimizer: optimizer,      
				});
				model.fit(height, weight, { epochs: 500 }).then(() => {});
			});

		}
	}
	module.exports = new exportar();