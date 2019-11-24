const LineByLineReader = require("line-by-line");
const path = require("path");
const classes = require("./classes");

async function getAtributes() {
  var lista = await importarSuperusGetFile();
  var listClass = [];
  var classe = {};
  lista.forEach((frase, i) => {
    criarClasse(frase, classe, listClass, i);
  });

  criarAtributos(listClass, lista);

  classes.listClasse = listClass;
}

function criarClasse(frase, classe, listClass, i) {
  if (
    frase
      .split(" ")[0]
      .toLowerCase()
      .match("classe")
  ) {
    classe = {};
    classe.varKey = i;
    classe.varName = frase
      .split(" ")[1]
      .replace("{", "")
      .replace("}", "");
    classe.properties = [];
    classe.methods = [];
    listClass.push(classe);
  }
}

function criarAtributos(listClass, lista) {
  var cont = 0;
  lista.forEach(frase => {
    if (
      frase
        .split(" ")[0]
        .toLowerCase()
        .match("classe")
    ) {
      for (let i = 0; i < listClass.length; i++) {
        const classe = listClass[i];
        if (frase.split(" ")[1].replace("{", "") === classe.varName) {
          cont = i;
        }
      }
    }
    var palavra = frase.split(" ")[0].toLowerCase();
    if (
      palavra.match("private") ||
      palavra.match("public") ||
      palavra.match("protected")
    ) {
      listClass[cont];
      if (
        frase
          .split(" ")[1]
          .toLowerCase()
          .match("método")
      ) {
        listClass[cont].methods.push({
          varName: frase.split(" ")[2].replace(":", ""),
          varType: frase.split(" ")[3].replace(";", ""),
          varVisibility: frase.split(" ")[0],
          parameters: [{}]
        });
      } else {
        listClass[cont].properties.push({
          varName: frase.split(" ")[2].replace(":", ""),
          varType: frase.split(" ")[3].replace(";", ""),
          varVisibility: frase.split(" ")[0]
        });
      }
    }
  });
}

async function importarSuperusGetFile() {
  let filePath = path.join("./", "facil.txt");
  let file = (await readFile(filePath)) || [];
  let produtosFile = [];
  file.splice(-2, 2);
  while (file.length) {
    produtosFile = produtosFile.concat(file.splice(0, 32));
  }
  return produtosFile;
}

function readFile(fileName) {
  return new Promise((sucesso, falha) => {
    try {
      let linhas = [];
      let lr = new LineByLineReader(fileName, {
        encoding: "utf8",
        skipEmptyLines: true
      });
      lr.on("error", err => falha(err));
      lr.on("line", line => linhas.push(line));
      lr.on("end", () => sucesso(linhas));
    } catch (error) {
      falha(error);
    }
  });
}

getAtributes();
