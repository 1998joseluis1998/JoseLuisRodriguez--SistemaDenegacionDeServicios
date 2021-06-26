//Importar código de la seguridad y vigilación de puertos
console.log(process.argv);
var tiempo = 0;
//console.log("isNaN('1b')",isNaN('1b'), "isNaN(1)", isNaN(1))

process.argv.map(a=>
{
	if(!isNaN(a))
	{
		tiempo = a;
		require("./seguridad/entrenar");
	}
})
if(tiempo == 0)
{
	console.log("No llegó nada")
}