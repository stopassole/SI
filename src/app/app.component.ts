import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import * as go from "gojs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  public listClass = [];
  especificacao;
  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.getAtributes();
  }

  getAtributes() {
    this.importarSuperusGetFile().then((lista: any) => {
      this.listClass = [];
      var classe = {};
      lista.forEach((frase, i) => {
        this.criarClasse(frase, classe, this.listClass, i);
      });

      this.criarAtributos(this.listClass, lista);

      let relacao = this.criarRelacoes(lista, this.listClass);
      this.init(this.listClass, relacao);
    });
  }
  criarClasse(frase, classe, listClass, i) {
    if (
      frase
        .split(" ")[0]
        .toLowerCase()
        .match("classe")
    ) {
      classe = {};
      classe.key = i;
      classe.name = frase
        .split(" ")[1]
        .replace("{", "")
        .replace("}", "");
      classe.properties = [];
      classe.methods = [];
      listClass.push(classe);
    }
  }

  criarAtributos(listClass, lista) {
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
          if (frase.split(" ")[1].replace("{", "") === classe.name) {
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
            name: frase.split(" ")[2].replace(":", "").replace("(", "").replace(")", ""),
            type: frase.split(" ")[3].replace(";", ""),
            visibility: frase.split(" ")[0],
            parameters: [{}]
          });
        } else {
          listClass[cont].properties.push({
            name: frase.split(" ")[2].replace(":", ""),
            type: frase.split(" ")[3].replace(";", ""),
            visibility: frase.split(" ")[0]
          });
        }
      }
    });
  }

  importarSuperusGetFile() {
    return new Promise((resolve, reject) => {
      let file: any = [];
      this.http
        .get("assets/facil.txt", { responseType: "text" })
        .subscribe(data => {
          try {
            file = data.split("\n");

            let produtosFile = [];
            file.splice(-2, 2);
            while (file.length) {
              produtosFile = produtosFile.concat(file.splice(0, 32));
            }
            resolve(produtosFile);
          } catch (error) {
            reject(error);
          }
        });
    });
  }

  init(classes, relacao?) {
    if (window["goSamples"])
      //  goSamples();  // init for these samples -- you don't need to call this
      var myDiagram = {};
    myDiagram = go.GraphObject.make(go.Diagram, "myDiagramDiv", {
      "undoManager.isEnabled": true,
      layout: go.GraphObject.make(go.TreeLayout, {
        // this only lays out in trees nodes connected by "generalization" links
        angle: 90,
        path: go.TreeLayout.PathSource, // links go from child to parent
        setsPortSpot: false, // keep Spot.AllSides for link connection spot
        setsChildPortSpot: false, // keep Spot.AllSides
        // nodes not connected by "generalization" links are laid out horizontally
        arrangement: go.TreeLayout.ArrangementHorizontal
      })
    });

    // show visibility or access as a single character at the beginning of each property or method
    function convertVisibility(v) {
      switch (v) {
        case "public":
          return "+";
        case "private":
          return "-";
        case "protected":
          return "#";
        case "package":
          return "~";
        default:
          return v;
      }
    }

    // the item template for properties
    var propertyTemplate = go.GraphObject.make(
      go.Panel,
      "Horizontal",
      // property visibility/access
      go.GraphObject.make(
        go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding("text", "visibility", convertVisibility)
      ),
      // property name, underlined if scope=="class" to indicate static property
      go.GraphObject.make(
        go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "name").makeTwoWay(),
        new go.Binding("isUnderline", "scope", function (s) {
          return s[0] === "c";
        })
      ),
      // property type, if known
      go.GraphObject.make(
        go.TextBlock,
        "",
        new go.Binding("text", "type", function (t) {
          return t ? ": " : "";
        })
      ),
      go.GraphObject.make(
        go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "type").makeTwoWay()
      ),
      // property default value, if any
      go.GraphObject.make(
        go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding("text", "default", function (s) {
          return s ? " = " + s : "";
        })
      )
    );

    // the item template for methods
    var methodTemplate = go.GraphObject.make(
      go.Panel,
      "Horizontal",
      // method visibility/access
      go.GraphObject.make(
        go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding("text", "visibility", convertVisibility)
      ),
      // method name, underlined if scope=="class" to indicate static method
      go.GraphObject.make(
        go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "name").makeTwoWay(),
        new go.Binding("isUnderline", "scope", function (s) {
          return s[0] === "c";
        })
      ),
      // method parameters
      go.GraphObject.make(
        go.TextBlock,
        "()",
        // this does not permit adding/editing/removing of parameters via inplace edits
        new go.Binding("text", "parameters", function (parr) {
          var s = "(";
          for (var i = 0; i < parr.length; i++) {
            var param = parr[i];
            if (i > 0) s += ", ";
            s += param.name + ": " + param.type;
          }
          return s + ")";
        })
      ),
      // method return type, if any
      go.GraphObject.make(
        go.TextBlock,
        "",
        new go.Binding("text", "type", function (t) {
          return t ? ": " : "";
        })
      ),
      go.GraphObject.make(
        go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "type").makeTwoWay()
      )
    );

    // this simple template does not have any buttons to permit adding or
    // removing properties or methods, but it could!
    myDiagram["nodeTemplate"] = go.GraphObject.make(
      go.Node,
      "Auto",
      {
        locationSpot: go.Spot.Center,
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides
      },
      go.GraphObject.make(go.Shape, { fill: "lightyellow" }),
      go.GraphObject.make(
        go.Panel,
        "Table",
        { defaultRowSeparatorStroke: "black" },
        // header
        go.GraphObject.make(
          go.TextBlock,
          {
            row: 0,
            columnSpan: 2,
            margin: 3,
            alignment: go.Spot.Center,
            font: "bold 12pt sans-serif",
            isMultiline: false,
            editable: true
          },
          new go.Binding("text", "name").makeTwoWay()
        ),
        // properties
        go.GraphObject.make(
          go.TextBlock,
          "Properties",
          { row: 1, font: "italic 10pt sans-serif" },
          new go.Binding("visible", "visible", function (v) {
            return !v;
          }).ofObject("PROPERTIES")
        ),
        go.GraphObject.make(
          go.Panel,
          "Vertical",
          { name: "PROPERTIES" },
          new go.Binding("itemArray", "properties"),
          {
            row: 1,
            margin: 3,
            stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left,
            background: "lightyellow",
            itemTemplate: propertyTemplate
          }
        ),
        go.GraphObject.make(
          "PanelExpanderButton",
          "PROPERTIES",
          { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
          new go.Binding("visible", "properties", function (arr) {
            return arr.length > 0;
          })
        ),
        // methods
        go.GraphObject.make(
          go.TextBlock,
          "Methods",
          { row: 2, font: "italic 10pt sans-serif" },
          new go.Binding("visible", "visible", function (v) {
            return !v;
          }).ofObject("METHODS")
        ),
        go.GraphObject.make(
          go.Panel,
          "Vertical",
          { name: "METHODS" },
          new go.Binding("itemArray", "methods"),
          {
            row: 2,
            margin: 3,
            stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left,
            background: "lightyellow",
            itemTemplate: methodTemplate
          }
        ),
        go.GraphObject.make(
          "PanelExpanderButton",
          "METHODS",
          { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false },
          new go.Binding("visible", "methods", function (arr) {
            return arr.length > 0;
          })
        )
      )
    );

    function convertIsTreeLink(r) {
      return r === "generalization";
    }

    function convertFromArrow(r) {
      switch (r) {
        case "generalization":
          return "";
        default:
          return "";
      }
    }

    function convertToArrow(r) {
      switch (r) {
        case "generalization":
          return "Triangle";
        case "aggregation":
          return "StretchedDiamond";
        default:
          return "";
      }
    }

    myDiagram["linkTemplate"] = go.GraphObject.make(
      go.Link,
      { routing: go.Link.Orthogonal },
      new go.Binding("isLayoutPositioned", "relationship", convertIsTreeLink),
      go.GraphObject.make(go.Shape),
      go.GraphObject.make(
        go.Shape,
        { scale: 1.3, fill: "white" },
        new go.Binding("fromArrow", "relationship", convertFromArrow)
      ),
      go.GraphObject.make(
        go.Shape,
        { scale: 1.3, fill: "white" },
        new go.Binding("toArrow", "relationship", convertToArrow)
      )
    );

    // setup a few example class nodes and relationships

    // var nodedata = [
    //   {
    //     key: 1,
    //     name: "BankAccount",
    //     properties: [
    //       { name: "owner", type: "String", visibility: "public" },
    //       { name: "balance", type: "Currency", visibility: "public", default: "0" }
    //     ],
    //     methods: [
    //       { name: "deposit", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" },
    //       { name: "withdraw", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" }
    //     ]
    //   },
    //   {
    //     key: 11,
    //     name: "Person",
    //     properties: [
    //       { name: "name", type: "String", visibility: "public" },
    //       { name: "birth", type: "Date", visibility: "protected" }
    //     ],
    //     methods: [
    //       { name: "getCurrentAge", type: "int", visibility: "public" }
    //     ]
    //   },
    //   {
    //     key: 12,
    //     name: "Student",
    //     properties: [
    //       { name: "classes", type: "List", visibility: "public" }
    //     ],
    //     methods: [
    //       { name: "attend", parameters: [{ name: "class", type: "Course" }], visibility: "private" },
    //       { name: "sleep", visibility: "private" }
    //     ]
    //   },
    //   {
    //     key: 13,
    //     name: "Professor",
    //     properties: [
    //       { name: "classes", type: "List", visibility: "public" }
    //     ],
    //     methods: [
    //       { name: "teach", parameters: [{ name: "class", type: "Course" }], visibility: "private" }
    //     ]
    //   },
    //   {
    //     key: 14,
    //     name: "Course",
    //     properties: [
    //       { name: "name", type: "String", visibility: "public" },
    //       { name: "description", type: "String", visibility: "public" },
    //       { name: "professor", type: "Professor", visibility: "public" },
    //       { name: "location", type: "String", visibility: "public" },
    //       { name: "times", type: "List", visibility: "public" },
    //       { name: "prerequisites", type: "List", visibility: "public" },
    //       { name: "students", type: "List", visibility: "public" }
    //     ]
    //   }
    // ];

    var nodedata = classes;

    var linkdata = relacao;

    myDiagram["model"] = go.GraphObject.make(go.GraphLinksModel, {
      copiesArrays: true,
      copiesArrayObjects: true,
      nodeDataArray: nodedata,
      linkDataArray: linkdata
    });
  }

  criarRelacoes(especificacao, listClass) {
    var relacoes = [];

    for (let i = 0; i < especificacao.length; i++) {
      const frase = especificacao[i];
      let primeiraPalavra = frase
        .split(" ")[0]
        .toLowerCase()
        .replace(":", "");
      if (
        primeiraPalavra.match("agregação") ||
        primeiraPalavra.match("generalização")
      ) {
        relacoes.push(this.getIds(frase, listClass, primeiraPalavra));
      }
    }
    return relacoes;
  }

  getIds(frase, listClass, primeiraPalavra) {
    var from, to, relationship;

    listClass.forEach(classe => {
      let classe1 = frase
        .split(" ")[1]
        .trim()
        .replace(" ", "")
        .toLowerCase();

      let classe2 = frase
        .split(" ")[3]
        .trim()
        .replace(" ", "")
        .toLowerCase();

      if (
        classe1 ===
        classe.name
          .toLowerCase()
          .trim()
          .replace(" ", "")
      ) {
        to = classe.key;
      }
      if (
        classe2 ===
        classe.name
          .toLowerCase()
          .trim()
          .replace(" ", "")
      ) {
        from = classe.key;
      }
    });

    if (primeiraPalavra.match("agregação")) relationship = "aggregation";
    else if (primeiraPalavra.match("generalização"))
      relationship = "generalization";

    return { from: from, to: to, relationship: relationship };
  }
}
