var fetch = require("node-fetch");
//import fetch from "node-fetch";

var fechas = require("./../Utiles/fechas.js")
var Cap = require('cap').Cap;
var lista = Cap.deviceList();
lista = JSON.stringify(lista, null, 2);
// console.dir(lista);

console.log("Iniciando código de monitoreo de puertos")

var decoders = require('cap').decoders;
var PROTOCOL = decoders.PROTOCOL;
const TUIP = '83.229.39.17';
var c = new Cap();
var device = Cap.findDevice(TUIP);
var filter = 'port 80 or port 4000';
var bufSize = 10 * 1024 * 1024;
var buffer = Buffer.alloc(65535);

var linkType = c.open(device, filter, bufSize, buffer);

c.setMinBytes && c.setMinBytes(0);

var IPs = [];


c.on('packet', function (nbytes, trunc) {
  //console.log("--------------------------------------------------------------------------------------------------------")
  //console.log("Llegó algo", fechas(new Date())) 
  // console.log('packet: tamaño ' + nbytes + ' bytes, truncado? ' + (trunc ? 'sí' : 'no'));

  // raw packet data === buffer.slice(0, nbytes)

  if (linkType === 'ETHERNET') {
    var ret = decoders.Ethernet(buffer);

    if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {
      //console.log('Decodificando la IP');

      ret = decoders.IPV4(buffer, ret.offset);
      //console.log('de: ' + ret.info.srcaddr + ' a ' + ret.info.dstaddr);

      actualizarIPs(ret.info.srcaddr);

      if (ret.info.protocol === PROTOCOL.IP.TCP) {
        var datalen = ret.info.totallen - ret.hdrlen;

        //console.log('Decodificando TCP');

        ret = decoders.TCP(buffer, ret.offset);
        //console.log(' del puerto: ' + ret.info.srcport + ' a el puerto: ' + ret.info.dstport);
        datalen -= ret.hdrlen;
        //console.log(buffer.toString('binary', ret.offset, ret.offset + datalen));
      } else if (ret.info.protocol === PROTOCOL.IP.UDP) {
        //console.log('Decodificando UDP');

        ret = decoders.UDP(buffer, ret.offset);
        //console.log(' del puerto: ' + ret.info.srcport + ' a el puerto: ' + ret.info.dstport);
        // console.log(buffer.toString('binary', ret.offset, ret.offset + ret.info.length));
      } else {
        //console.log('No soporta IPV4: ' + PROTOCOL.IP[ret.info.protocol]);
      }
    } else {
      //console.log('Unsupported Ethertype: ' + PROTOCOL.ETHERNET[ret.info.type]);
    }
  }
});


function actualizarIPs(ip) {
  if (ip != TUIP) {
    var incluye = false;
    IPs.map(a => {
      if (a.ip == ip) {
        incluye = true;
      }
    });
    if (incluye == false) {
      IPs.push({ ip: ip, cant: 1 });
    }
    else {
      const ind = IPs.findIndex(a => ip == a.ip);
      IPs[ind].cant = IPs[ind].cant + 1;
    }
  }
}
var tiempo = 5000;

function timeout() {
  setTimeout(function () {
    //console.log(IPs);
    if (IA.entrenando == true) {
      IA.entrenar(IPs.map(a => a.cant), tiempo);
    }
    else {
      const IACant = IA.predecir(tiempo / 1000)[0];
      IPs.map((a) => {
        console.log(a.cant, IACant);
        if (a.cant > IACant * 20) {
          banear(a.ip);
        }
      })
    }

    IPs = []
    tiempo = (Math.floor(Math.random() * 7000) + 3000)
    console.log("tiempo", tiempo)
    timeout();
  }, tiempo);
};
timeout();

var baneados = [];

const shell = require('shelljs')
const fs = require("fs")

function buscarguardarip(ip,recordFileName,myData){

  console.log("Recuperando datos de IpStack")
    fetch(ipstack + ip + '?access_key=' + apikey, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((res) => res.json())
      .then((json) => {  
        //muestra todos los datos de la ip
        console.log(json);  
        //conseguimos los datos necesarios para la ip
        myData.push({
          ip: json.ip,
          continent_name: json.continent_name,
          country_name: json.country_name,
          region_name: json.region_name,
          city: json.city,
          latitude: json.latitude,
          longitude: json.longitude
        }) 
        //agregamos a la lista
        fs.writeFile(recordFileName, JSON.stringify(myData), () => {
          console.log("File updated");
        });    
      });    

}

function banear(ip) {
  var incluye = false;
  baneados.map(a => {
    if (a == ip) {
      incluye = true;
    }
  });
  if (incluye == true) {
    return;
  }
  baneados.push(ip);

  shell.exec('ufw insert 1 deny from ' + ip + ' to any port 80')
  shell.exec('ufw insert 1 deny from ' + ip + ' to any port 4000')

  //obtener datos de ipstack
  const ipstack = 'http://api.ipstack.com/';
  const apikey = 'c9342fe3917893cfe36255f7ed21aaf4';

    //
  const recordFileName = "ipRecords.json";
  
  var myData=[];

  if (fs.existsSync(recordFileName)) {
    fs.readFile(recordFileName, "utf-8", (err, data) => {
      if (err) {
        console.log("Error:", err)
      }
      var found = false;
      //console.log(data);
      myData = JSON.parse(data);      
      // Buscar IP en datos
      for (let i = 0; i < myData.length; i++) {
        if (myData[i].ip == ip) {
          found = true;
          console.log("IP ya conocida:", myData[i]);
          break;
        }        
      }
      if (!found) {
        // Buscar ipstack
        buscarguardarip(ip,recordFileName,myData);
      }
    });    
  }
  else{
    buscarguardarip(ip,recordFileName,myData);
  }

  var incl = false;
  reincidentes.map(a => {
    if (a.ip == ip) {
      incl = true;
    }
  });
  var cantidadIncidencias = 1;
  if (incl == false) {
    reincidentes.push({ ip: ip, cant: 1 });
  }
  else {
    const ind = reincidentes.findIndex(a => ip == a.ip);
    reincidentes[ind].cant = reincidentes[ind].cant + 1;
    cantidadIncidencias = reincidentes[ind].cant;
  }
  var mensaje = "Baneando a " + " " + ip + " " + "por " + " " + (30) * cantidadIncidencias + " " + "segundos";
  console.log(mensaje)
  fs.appendFile("Registro.txt", fechas(new Date()) + "\n" + mensaje + "\n", function (err) {
    if (err) throw err;
    console.log('Registro actualizado');
  });
  setTimeout(() => { desbanear(ip) }, (30 * 1000) * cantidadIncidencias);
}

var reincidentes = [];

function desbanear(ip) {
  baneados = baneados.filter(a => a != ip);
  console.log("Desbaneando a ", ip);
  shell.exec('ufw delete deny from ' + ip + ' to any port 80')
  shell.exec('ufw delete deny from ' + ip + ' to any port 4000')
  console.log()
}

var IA = require("./../Utiles/IA.js")
//IA.activarentrenamiento(1000 * 60 * 20);
IA.cargarModelo();

// var x = [1.82, 1.70, 1.87, 1.54, 1.63]
// var y = [80, 75, 85, 65, 72]
setTimeout(() => {
  console.log(IA.predecir(5)[0]);
}, 3000)
