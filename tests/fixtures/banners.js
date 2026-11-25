// Textos reales del catálogo.
// - source 'manual': transcripción limpia del banner (spec §6).
// - source 'ocr': salida cruda de tesseract (spa) sobre la franja superior (25 %) e inferior (25 %)
//   de cada foto, separadas por STRIP_SEPARATOR. "expected" se leyó a mano.
export const BANNERS = [
  {
    "file": "_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg",
    "source": "manual",
    "text": "250 soles. Dragon Ball Z 3 álbum + caja de 100 sobres sellados.\nNavarrete original, año 1999. (Cod. DB1082)\n=====\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO, ÚNICO CAMBIO POR HUECO DE POLILLA, NO NOS HACEMOS RESPONSABLES POR EL ESTADO DE LAS FIGURAS",
    "expected": {
      "price": 250,
      "code": "DB1082",
      "editorial": "Navarrete",
      "year": 1999,
      "isOriginalHint": true,
      "tagsInclude": [
        "sellado",
        "combo",
        "sobres"
      ],
      "titleIncludes": "Dragon Ball Z 3"
    }
  },
  {
    "file": "_5 FUTBOL/VITRINAfut (16)b.jpg",
    "source": "manual",
    "text": "250 soles. Álbum Tapa dura, COPA MUNDIAL 2026,Panini licenciado.\n(Cod. VR1149)\n=====\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.",
    "expected": {
      "price": 250,
      "code": "VR1149",
      "editorial": "Panini",
      "year": 2026,
      "isOriginalHint": true,
      "tagsInclude": [
        "tapa-dura"
      ],
      "titleIncludes": "COPA MUNDIAL 2026"
    }
  },
  {
    "file": "_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (62).jpg",
    "source": "manual",
    "text": "=====\nAlbum WALT DISNEY TU Y YO y set completo a pegar - Replica de excelente calidad\nVersión TAPA BLANDA a 60 soles SOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA\nENTREGA O ENVÍO. COLECCIÓN REVISADA TAL CUAL INDICA LA DESCRIPCIÓN",
    "expected": {
      "price": 60,
      "code": null,
      "editorial": null,
      "isOriginalHint": false,
      "tagsInclude": [
        "set-a-pegar",
        "tapa-blanda"
      ],
      "warningsInclude": [
        "code_missing"
      ],
      "titleIncludes": "WALT DISNEY"
    }
  },
  {
    "file": "_ 35__ DESC/VITRINAdblic (24).jpg",
    "source": "ocr",
    "confidence": 54,
    "text": "\" ¿Em us UU  ;—]—]—Z na IE m— www e\n|\n,\n, Álbum vacío DRAGON BALL Super - Editorial Navarrete /año 2018 (Cod. DB0106) 30 soles\n| —\n\nTEN \"“ LN TAN ! y EN UN 1717 1727 TY UN /M=—. y\nl e CACA | » 4, Da |\n| 1530 WI \"0 A 7 Ta\no NN ANA EAN 4h NN 2 7 We HE => TA NTMATION\n=====\n, / AL V 4 ES US. —\n| - ÁLBUM LICENCIADO DD\nhe cor 20 18 E NAVARRETE\nT\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA -\nENTREGA O ENVÍO. COLECCIÓN REVISADA Y TAL CUAL INDICA LA DESCRIPCIÓN ,",
    "expected": {
      "price": 30,
      "code": "DB0106",
      "editorial": "Navarrete",
      "year": 2018,
      "tagsInclude": [
        "vacio"
      ],
      "titleIncludes": "DRAGON BALL Super"
    }
  },
  {
    "file": "_ 35__ DESC/VITRINAdigimonlic (1).jpg",
    "source": "ocr",
    "confidence": 62,
    "text": "Álbum vacío DIGIMON Digital Monster - Editorial Navarrete, 30 soles\n' procedencia Brasil (idioma portugues) / año 2000 (Cod. VR01004)\n;\n«y, LIVRO ILUSTRADO ..... RS 2,90\nN AS EE SC IAE\n\nUe Y ETRE | 551, VE a\n\n<= 4 E: — — a\n\n= 7 E: E — - E | = E É E:\n=====\n4 ZA | 7 \"Ññ\n7 AVENTURANO. SAS Y\ny 7 S\n7 y\nMUNDO DIGITAL — = € /\n\n—— Ne E ñ =\n\nMAS: Ns q | E\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA\nENTREGA O ENVÍO. COLECCCIÓN REVISADA Y TAL CUAL INDICA LA DESCRIPCIÓN\n\nuuu h % % Y A 4 4% Y",
    "expected": {
      "price": 30,
      "code": "VR01004",
      "editorial": "Navarrete",
      "year": 2000,
      "titleIncludes": "DIGIMON"
    }
  },
  {
    "file": "_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (1)a.jpg",
    "source": "ocr",
    "confidence": 81,
    "text": "... ... ...\n1200 soles Colección completa (45/45) de promocionales Yokos Dragon Ball Z,\nsnacks Chipy originales, año 1997 (Cod. DB0126)\n5\n7\n=====\n——\nL\nL\nLe\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA\nENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION\nuuu uuu uuu",
    "expected": {
      "price": 1200,
      "code": "DB0126",
      "year": 1997,
      "isOriginalHint": true,
      "tagsInclude": [
        "completo"
      ]
    }
  },
  {
    "file": "_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (28)b.jpg",
    "source": "ocr",
    "confidence": 63,
    "text": "... ... ..wu.\n700 soles. DRAGÓN BALL GT Cards Serie 1, Colección Completa (100/100) Incluye coleccionador\noriginal. Editorial Panini licenciado. Idioma italiano. Año 1999. (Cod. DB0159)\n9\n”\n” E\n= N (72)\n/ |\nla y Wu y ==\n=====\nEu —— NA Un >\n_E. 4 A 4 La > a\n> a — J w  — e)\n3 E “— \"a\na! EXE\n<. > PAMINI\ntel\n« e = re : > Le\nE\nE\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO.\nCOLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.\nuuu uuu uuu",
    "expected": {
      "price": 700,
      "code": "DB0159",
      "editorial": "Panini",
      "year": 1999,
      "isOriginalHint": true,
      "tagsInclude": [
        "completo"
      ],
      "titleIncludes": "DRAGÓN BALL GT"
    }
  },
  {
    "file": "_1 DRAGON BALL/SIN LICENCIA/VITRINAdb (0)a.jpg",
    "source": "ocr",
    "confidence": 59,
    "text": "... ... ...\n360 soles. PACK DRAGON BALL Z: LAS PELÍCULAS. Volúmenes 1 al 5 — Álbumes Edición tapa 1\ndura + set completo a pegar + 8 mini pósters. Editorial Kame House, año 2023. (Cod. DB0173) 1\n9 4\n3\n9\n, y SORACN A NE STICKERVALEUMY | \"y E A : — LINA 1 \"e\nD CAE NA AN PE\n— ——— (NE A ( 7 NN DN D— La\n¿ 26, LAS PELICULAS N 4 SN ANT € 7 MA H ñ a — == du\n7 27 A eN = NL —AAZ77 | FE 7 — e\n=====\n: Vo Na - E Me a\nNI ; AUULa MA — | N\n7 ¿e UI ra TE e Y 4\nms - LO) “ Y\n|\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA E”\nENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION. \"\n7\nkh 4 Y Y i 4 Y Y uuu a r",
    "expected": {
      "price": 360,
      "code": "DB0173",
      "editorial": "Kame House",
      "year": 2023,
      "tagsInclude": [
        "set-a-pegar",
        "tapa-dura"
      ]
    }
  },
  {
    "file": "_1 DRAGON BALL/SIN LICENCIA/VITRINAdb (3)e.jpg",
    "source": "ocr",
    "confidence": 57,
    "text": "> XA\n250 soles. Colección Completa (60/60) de TAZOS METALMIX DRAGÓN BALL Z.\nRemasterizado de excelente calidad, Sabritas (Frito-Lays), año 2003. (Cod. DB1087)\n— NA - y A A : ””\nEX 7 | te == 7 Pz NE\ne ON ES AS 0\n< , ve Ne 7 e y y a. f N e C de\n==\" e NY NE e\n=====\n_———— —y — — — _——\nZa r AA 7 Y Zy La ZN 7\na 7 N <A fi y 7 PAE: 2030 Y ey\n\nYA Fi A ae TE 7%. [41 A 1 A\n—_ = L Me Ue ue \"y\n5 7 Ae N Xx a 6 D Un «q wíi a (Un, € Alis\nNo Ra uz UL, Y — LU TE\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA\nENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.",
    "expected": {
      "price": 250,
      "code": "DB1087",
      "editorial": "Sabritas",
      "year": 2003,
      "tagsInclude": [
        "completo"
      ],
      "titleIncludes": "TAZOS METALMIX"
    }
  },
  {
    "file": "_2 POKÉMON/LICENCIADOS/VITRINApokemonlic (1).jpg",
    "source": "ocr",
    "confidence": 68,
    "text": "... ... : ...\n100 soles. POKEMON ULTRA Vol. 4 binder coleccionador, (incluye portadas) + paquetón\n\n, de 25 sobres (7 cartas por sobre). Editorial 3 Reyes, año 2017. (Cod. PK1511)\nA\ns\n\n- —a A y = =>! e 7—= y ”\n\nAN aC COLECCIONADOR ORIGINAL DE CARDS 4 4 :\n- \"NN \"7, a 47\nA a MEE A UM EA:\n=====\ne] “— y a\nE. 12 MICAS. E ox ” a 1 _—\n— | _-— 1 REYES | É\na - x - — E A % ,\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO, ”\nÚNICO CAMBIO POR HUECO DE POLILLA, NO NOS HACEMOS RESPONSABLES POR EL ESTADO DE\nLAS FIGURAS Y CONTENIDO DENTRO DE LOS PAQUETONES/CAJAS SELLADAS/ENLIGADAS.\nJUE.\nuuu a. 7 uuu uuu",
    "expected": {
      "price": 100,
      "code": "PK1511",
      "editorial": "3 Reyes",
      "year": 2017,
      "tagsInclude": [
        "sobres",
        "combo"
      ]
    }
  },
  {
    "file": "_2 POKÉMON/LICENCIADOS/VITRINApokemonlic (3).jpg",
    "source": "ocr",
    "confidence": 54,
    "text": "... ... . ... .\nAlbum peruano POKEMON 2 + set completo a pegar, Navarrete original - 120 soles\n:\nr\nao RIM > “00 — . y MpOW CTS AMET PA | AS, 1 de == a\n=====\nMr. E, 0! NON | ——— —\nLe E A ££\n.\n\"a\n* L\n: L\n7 5\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DIAS MAXIMO LUEGO DE LA\nENTREGA O ENVIO. COLECCION REVISADA Y TAL CUAL INDICA LA DESCRIPCION\n... ... ” a...",
    "expected": {
      "price": 120,
      "code": null,
      "editorial": "Navarrete",
      "isOriginalHint": true,
      "tagsInclude": [
        "set-a-pegar"
      ],
      "warningsInclude": [
        "code_missing"
      ],
      "titleIncludes": "POKEMON 2"
    }
  },
  {
    "file": "_2 POKÉMON/SIN LICENCIA/VITRINApokemon (1)a.jpg",
    "source": "ocr",
    "confidence": 45,
    "text": "... ... ... —\n250 soles. ENCICLOPEDIA DEFINITIVA GALAXY POKÉMON, álbum tapa dura (+ de 160 págs.) + Set completo\nde figuras (+ de 1400 figuras) con su cajita + Póster central + Campo de batalla + Colección de caps con\nsu coleccionador, editorial Elite. (Cod. PK0114)\n— 7 E y A\nb | AN Y AA > Y\n, ES NN — EY E\n— EN 7 -:\n— MM AS\nTD o] ———;—;]—;];—]]— == | a : de. la] Y\n:. E. Sr Pe E —_ Gulize e\n£ A KEN “. ¿ra > o Ne y 7 U > | A\nLa PA o y E. — | u > A) u E\n7 EN, 4 A - ==\n== | “CAMEL A Y V. (9) Pr E AE EAN N\n=====\nRe PANIENE> NE Tau M7 —: > Y A\n\n“Y | L Al e - a. 7 Ye Y Zo _—\n\nhead pee, cal paa ECT 2 = UE y E EN de a ON\n\n: — [E 1 =D Ñ e LM -AN 74)\n\nTo N 2 EE A oy 7 Z- Y a Ns a + 2 E. 67\n\ní T 27. ATEN e . e CA PUNA. NR\n\n3 DN MR Y7 Z =- — a A > Y E Ne E\n\n: ARES Pa y e : tu ANI PROX] NEL\n\n1 <=) E - Tem : : ADE E -\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO. COLECCION\nREVISADA TAL CUAL INDICA LA DESCRIPCION.\n\nuuu uuu uuu",
    "expected": {
      "price": 250,
      "editorial": "Elite",
      "tagsInclude": [
        "tapa-dura"
      ],
      "titleIncludes": "GALAXY"
    }
  },
  {
    "file": "_2 POKÉMON/SIN LICENCIA/VITRINApokemon (27)A.jpg",
    "source": "ocr",
    "confidence": 41,
    "text": "... .... ...\n100 SOLES. MAZO DE CARTAS COLECCIONABLES POKEMON POCKET MONSTER DE LOS ANOS\n; 920'S. DOBLE CARA, CARA HOLOGRAFICA. HECHO EN TAIWAN (36/36) (COD. PK1500)\n, X= 2 PTA e - E. Ea NO a. e — ra \"a Z z Price MON A TA E\n== Se NOME : S s E 7 RN + AA ME nm 7 > UE 1 METEDO? 2. Pat 7 \"ENNNO El € k\nPENiin MONSTERS» POcIEr MONSTERS PO JET MONSTERSES uu E PEE\na UE IE A Zo a TEE DE !\n= y Bo o A NA € X ¡a EZ SU Ne E E N\nZa o NU EN 2, 2 2 o, EA 57 Des LA » -\ne NES CERDA e EL Ne Nal A a NE\nA Wo EE E E er Y TN AE Fe (A\nEDT E NE < EEE E A - Da |\nE E LA ESE EN LE TE CANA ZA ED a\n=====\nNE CODNNIENDS] 1) INE Pa MIND Ne NE NERO LAT TEDIOSO\nE A e) PTA — MY y” PA : NN\nA ad A o EEN ME Na Pa 00) 0\nEye a o ZA ue o: EE oe y NO O »\n\na A aa = Na LA e NS .- | ==\" pm\nEE CREE E — — SE\n\n| ' ,\n\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DIAS MAXIMO LUEGO DE LA ENTREGA O ”\n\nENVIO. COLECCION REVISADA Y TAL CUAL INDICADA LA DESCRIPCION.",
    "expected": {
      "price": 100,
      "code": "PK1500",
      "year": null
    }
  },
  {
    "file": "_3 CABALL DEL ZOD/LICENCIADOS/VITRINAcabdzlic (1).jpg",
    "source": "ocr",
    "confidence": 67,
    "text": "... ... ...\n: Album peruano CABALLEROS DEL ZODIACO + set completo en Laminas,\n, Navarrete original - 250 soles (Cod. CZ0010)\n=====\nUNIRA LOS DIOSES HUERRERUSDE ArtA — o] MEN\n: r\ny : - ,\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DIAS MAXIMO LUEGO DE LA\nENTREGA O ENVIO. COLECCION REVISADA Y TAL CUAL INDICA LA DESCRIPCION\nuuu uuu, uun",
    "expected": {
      "price": 250,
      "code": "CZ0010",
      "editorial": "Navarrete",
      "isOriginalHint": true,
      "tagsInclude": [
        "completo"
      ],
      "titleIncludes": "CABALLEROS DEL ZODIACO"
    }
  },
  {
    "file": "_3 CABALL DEL ZOD/LICENCIADOS/VITRINAcabdzlic (5)a.jpg.jpg",
    "source": "ocr",
    "confidence": 51,
    "text": "- . ... ... == : ... “\n400 soles. LOS CABALLEROS DEL ZODIACO 3, álbum peruano (hojas tipo bond) + set completo de\nláminas. Navarrete licenciado, año 1996. (Cod. CZ0021)\nse — N y |] “ \" 19 a | | T Ml 5 m 4 1 e \" EZ Te\n\nE u MS EN 1 Ni = E k\nEY | 10 | Y eu ZA ' | | Mu E *” 2 ER = == EN\n- NY | > “a! (A e E EE DE HH i\nMILE el | Y 11.\nEZ ETR JN M 11133 ENE: E Nr E |\n=====\nCO A\n1 NN 111070 EDEN MB | o\nAPUNTA E ENE\n|El e A ENCIS | I 1\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO. COLECCION\nREVISADA TAL CUAL INDICA LA DESCRIPCION.",
    "expected": {
      "price": 400,
      "code": "CZ0021",
      "editorial": "Navarrete",
      "year": 1996,
      "isOriginalHint": true
    }
  },
  {
    "file": "_3 CABALL DEL ZOD/SIN LICENCIA/VITRINAcabdz (0).jpg",
    "source": "ocr",
    "confidence": 43,
    "text": "... ... ...\n250 soles. Álbum ENCICLOPEDIA CABALLEROS DEL ZODIACO GALAXY tapa dura. Incluye\n136 páginas + más de 1100 figuras a pegar + Caja porta figuras + poster central + 120\ncaps Saint Seiya Attack + campo de batalla + 2 Coleccionadores. (Cod. CZ1502)\n\nZ A ARTE ma N UNA RETA ZA\nE WE > Z 7 AR A Lu N 2112\nA NN a. «(7 EL WE 7 es No AEB\nY EALAJA > RESTAN REN El x. E\nAL E) 7 UE - UA. CE\n=====\n| PA hi AE Xu x Xu A 4 ÓN N a e 7 po > 20 [q —\n|| | EA ”N A IS NL, PAÁAIS CAD 102, ==\n- sr un Ta b e ! a | —— : NN e Y [ Vo N ¿Axa f Ka VER (46 E, A\nPa 2 NI 1 Ml 1 TEXTE VEN\ne RE TL NES 3 Y NIN DANNA EA A\nM7 LE E AN NN US “E 77777717 ADA AA\nEARL [39 a AAA | A e A Ue PRISA “a YE P/ >\nPE E A | ZA Y 21.1 ED Y. LE. le Ea ERA! EA.\n5 E > _- A E -- e NN RO A. e A\n== La DN q —]— a\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA\nENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.\nuu... uu. uu...",
    "expected": {
      "price": 250,
      "code": "CZ1502",
      "tagsInclude": [
        "tapa-dura"
      ]
    }
  },
  {
    "file": "_3 CABALL DEL ZOD/SIN LICENCIA/VITRINAcabdz (21).jpg",
    "source": "ocr",
    "confidence": 49,
    "text": "Colección completa de (150/150) Cards CABALLEROS DEL ZODIACO Vol. 5, SAGA DE POSEIDON\n+ 9 Lamincards. Incluye 9 miniposter + folder coleccionador - 50 soles (Cod. CZ0009)\n\" ur L A a nz Y nave ANERLS Y —\naer ue pra ua JA Js me 5 7 EN CO\n, AL e ... N as NN a ss” a , nó NN a 06 N\nN CNE E a TATIES\ne E E PRE a JA\na a |. NV ), C NY N Má N » y 2 LA\n—. un E E ARNES Me | ES\n7 ANI e 77: IS) =) a .\nAz Ae CAEN Sun a\n=====\n== | e AT E e. . 97 78 = Tf. CEA 7 AE Y\nUA NA y — SAGADE POSEIDÓN 4 Al = »\nUu ANOS 1, | Ñ y Po | 5 | a A —]] — Lea — =,\nPp = A LUN mens TE METIO TE ue,\nmZ hera Uu LN \"EN N Na [a |\nMEN 7 ZA SN 7 xa \"E \"Ci ul NES $ E\nall 7772 € <a NAVA Y) Y 17 179 Ñ NA MU E As 5\nMO malo On 918 Ea\n== a NZIN BEANS aia AD La | ES NU LC NU —=—\n— e: 1% - Y: EA dl \"al el Es! us a\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DIAS MAXIMO LUEGO DE LA ¡Mi\nENTREGA O ENVIO. COLECCION REVISADA Y TAL CUAL INDICA LA DESCRIPCION",
    "expected": {
      "price": 50,
      "code": "CZ0009",
      "tagsInclude": [
        "completo"
      ],
      "titleIncludes": "CABALLEROS DEL ZODIACO"
    }
  },
  {
    "file": "_4 DIGIMON/VITRINAdigimon (0)A.jpg",
    "source": "ocr",
    "confidence": 53,
    "text": "250 soles. DIGIMON ENCICLOPEDIA DEFINITIVA, álbum tapa dura (184 páginas) + set completo a pegar\n\n(más de 1300 figuras) + poster central + caja porta stickers + colección de 120 caps con folder\nj coleccionador + Afiche Digimundo. Año 2026. (Cod. DG0018)\n\npura r\n: 1\nE EME TN eE EONO ES LA LUS LIE DE AS CA E ” Ra 7 N\nE P < A Y TT MECO y - E\n3 ” DIGIN MO! NED . Dem A F a | == 2 a l\n=====\n5 a NN TA EE Y a CEA — E ANNO NE E\nA GEN EN DES\nx > AP NA LA EA\nS a > >| ) ! 1 S N 1 NN NS -\nE DIGIMON Gl IE E A RS NETA 0\n-_——\". A 2 JE LT EEN DAI IAS -\nLa\nE\nE\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO.\nCOLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.\nk 4 Y Y i 4 Y Y . 4 Y Y",
    "expected": {
      "price": 250,
      "code": "DG0018",
      "year": 2026,
      "tagsInclude": [
        "tapa-dura",
        "set-a-pegar"
      ]
    }
  },
  {
    "file": "_4 DIGIMON/VITRINAdigimonlic (10).jpg",
    "source": "ocr",
    "confidence": 52,
    "text": "uuu un u.wu.\n20 soles cada uno - 3 por 40 soles.\nMiniaturas Digimon Coca Cola Serie 2 , año 2000,\nZ licenciados. Estado tal cual fotos. (Cod. DG1503)\nA\n4:\n_- ,\nhiicz=O\nE 4\n=====\n* E L E nz Y AN q E Y 3 ». y\n<a 4 10 4 K N RON NN o:\nLl £ * e % 4 E RAS >» .\ny Y É 4 É po á >: 7 R 4 EN E U\n£ ; y Ne »\" Xx 4 % <a 2 NU Ne .\nMU Ca 4 Y 1 0 4 ,\nE 3 r 1 “Ae 3 q ,\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA re\nZ ENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION. | Pi\nFa ra\na... a... y a... - —",
    "expected": {
      "price": 20,
      "code": "DG1503",
      "year": 2000,
      "isOriginalHint": true,
      "warningsInclude": [
        "multiple_prices"
      ]
    }
  },
  {
    "file": "_5 FUTBOL/VITRINAfut (0).png",
    "source": "ocr",
    "confidence": 52,
    "text": "... ... ... ana\n—... 50 SOLES CADA UNO. COBERTORES ARTESANALES TAPADURA PARA ALBUMES\nORIGINALES DE LOS MUNDIALES HECHOS POR PANINI (COD. VR1604)\n> E ESA 7 [APURE\n7 É a € 5 EA NE xXx X/\nDD” AT: mE: Er LL 9 Xen:\ní pe í == r Dz RE NN A Z\n: FRANCE N Na a Mo EE 4 JE\n4 | - Wa pel 220. TAE\nE NE E == => A. LL A LD E Dr VOR EB -\n=====\nEZ -— Y Ea Ne AE\nE N A -n > — a | - í E a pe E\nE uN > -— e - a E\n| 7. OS exe Pl : | Fer KO A\n\n» ——9N A De - ñ f ]\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DIAS MAXIMO LUEGO DE LA ENTREGA O\n\nENVIO. COLECCION REVISADA Y TAL CUAL INDICADA LA DESCRIPCION.\nuuu <o uuu uuu",
    "expected": {
      "price": 50,
      "code": "VR1604"
    }
  },
  {
    "file": "_5 FUTBOL/VITRINAfut (16)c.jpg",
    "source": "ocr",
    "confidence": 65,
    "text": "— ——— ss 4. —-——A Ts UA ... E UA\n\n| 220 soles. WORLD CUP 2026, álbum vacío tapa dura SILVER, panini licenciado. (Cod. VR1175)\n\n, ¿de E\n\n| ¿Gfrcia. STICKER COLLECTION\n\nPTA\n=====\n[Jy PAMINI e\ne\n| É L\n— ,\nLe\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO. COLECCION -\nU\nREVISADA TAL CUAL INDICA LA DESCRIPCION. )\n|\nXT > uu. : «UN IEA =",
    "expected": {
      "price": 220,
      "code": "VR1175",
      "editorial": "Panini",
      "year": 2026,
      "isOriginalHint": true,
      "tagsInclude": [
        "tapa-dura",
        "vacio"
      ],
      "titleIncludes": "WORLD CUP 2026"
    }
  },
  {
    "file": "_6 VARIADO/LICENCIADOS/MODERNAS , VIGENTES/VITRINAvarlicm (0)1a.jpg",
    "source": "ocr",
    "confidence": 51,
    "text": "... .... ...\n120 soles. SOLO LEVELING Álbum + set completo a pegar + 2 Armables coleccionables. Navarrete\noriginal. Año 2026 (COD. 1218)\n\n, —- J A O, y E y a —\ne Eng, ! ) us\n\no Mix | Y 1 £ 7 ¡€CCA)\n\nque 7N. | = y o 7 N / Y , 71 a > 9) “\n\nE — Y 7 e DN A MU\n\n\"L y y Y 7 BN o —¡ “U », [ L\n\nn | y q 6 : va ó AS [de EA % e x\n| e ; a > y e A -\n2 ——N j - a des e NIE Eo E, re =P . Ta KR\n=====\n1.» | —— + ll *) E\na 2\" 1 19 ZE ANAL 1-9\nÚ | a La k\nE 4 UN [ Z u DE\n! 1 E ANIEC! 1\nÉ | ET NR | K\n== 11 EN IC! 1 IN == _- -\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO. COLECCIÓN\nREVISADA TAL CUAL INDICA LA DESCRIPCIÓN.\nuuu uuu uuu",
    "expected": {
      "price": 120,
      "code": null,
      "editorial": "Navarrete",
      "year": 2026,
      "isOriginalHint": true,
      "tagsInclude": [
        "set-a-pegar"
      ],
      "warningsInclude": [
        "code_suspicious"
      ],
      "titleIncludes": "SOLO LEVELING"
    }
  },
  {
    "file": "_6 VARIADO/LICENCIADOS/MODERNAS , VIGENTES/VITRINAvarlicm (2).jpg",
    "source": "ocr",
    "confidence": 39,
    "text": "UN | NÁlbum PHINEAD Y FERD + set completo a pegar, Panini original, año 2011 - 100 soles E 1\nsn f => m_— EN * IELIS EVE | GA DA + |\nMu. CE su \" | 3 pul BUESA po -— |.\n1 | e 2 a 2.10\nE a E up 1 —_ á y ) 1 a 1 EIA A; on A l ; < ' |\nTN | | 4 7 A E N 4 uz >» 2. 1 ” : e —Q j Ra |\nMATIRS Du TT anmuutitis aa * | Ed\n| ' N ——];——TTTT—_— Le r “ e o a Lon : LA - ZEN e 7 el |\n=====\nA Y... Pn EN CENDNIOS y\n\nUr see A END MIE Le L vna A Ml pH N N AUN |\n(OTTIZE A Th Te MALE, ON TRIO: ES:\na | | i | A , » y : “ l Ai ne A ¡EN NC NOS\nHN | ASI e A ANTE X.\na A y i 2 | N VÍ Y ] í TT UN E | ( £ | eZ =\nY NE 7 : \" e e L - a ye Y á — L\n| EA\nEon UMLLINAS BONITA NA ae | a mr E. E ==\nAA UNNE ENTREGA O ENVÍO. COLECCIÓN REVISADA Y TAL CUAL INDICA LA DESCRIPCIÓN MIRES NUS",
    "expected": {
      "price": 100,
      "editorial": "Panini",
      "year": 2011,
      "isOriginalHint": true
    }
  },
  {
    "file": "_6 VARIADO/LICENCIADOS/RETRO/VITRINAvarlicr (11).jpg",
    "source": "ocr",
    "confidence": 56,
    "text": "— o e NU au e AU\n\n| 80 soles. LOS REINOS DE LA NATURALEZA paquetón, año 1985. (COD. VR1663)\n,\na y É só\n| f l É | A\n\n\"E - ”\n\n| — , , gos,\n\n2 |\n=====\na E á 0» me I |\n3 - > p : ”\nY => E LN de a\na i E A\n\" La\n. E » le\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO,\n| ÚNICO CAMBIO POR HUECO DE POLILLA, NO NOS HACEMOS RESPONSABLES POR EL ESTADO DE\n| LAS FIGURAS Y CONTENIDO DENTRO DE LOS PAQUETONES/CAJAS SELLADAS/ENLIGADAS. |\n— u.. CO SÁRSÑÚÉÁÓÓUÓUÓUÑÉÑRUÓCUÓCUCUURUU",
    "expected": {
      "price": 80,
      "code": "VR1663",
      "year": 1985,
      "tagsInclude": [
        "sobres"
      ]
    }
  },
  {
    "file": "_6 VARIADO/LICENCIADOS/RETRO/VITRINAvarlicr (26).jpg",
    "source": "ocr",
    "confidence": 40,
    "text": "bre: Há — 1 ID CABE PAEZ: Y MI) LIO\nAE . > me il DD TL\n4814 e Pai e Io a e | 10 EA Dz TEA E sen 2003 - 80 soles\nE [Álbum LIGA DE LA JUSTICIA + set completo a pegar, Navarrete original, año 2003-80 sole\n1 1.1 t | = r = \"\nETS | E MENS \" NE\n\"NE a NE | 7 = — 4 > E EIA\nNe CUE! -EN ALL ECEREL NA “\ntn — ! — > ——_— e r — Mu f\nE a NIN 3 NA\nLI STICKER ALBUM | y |\n=====\nUTN 2 MIENTRAS TAE A TEMES NEECA MAME E NV AS PY EUR DONE CA\n1 LUPE —— | r ET 0 EST |! |\nOT l L 2.1 “Nara -— A A\nmu ae Y IO NE\n4 1 al QEETEL! [IO E\nPEA / ) S y y (ÓN. PE P Co IED\n\" —. - Y COSES E\nNED Uy í f 6 y |\nur ! — TT TI DO , 11/00 ME A \" EC ¡A NO uu PD. - Zo — f | I\nUN PISOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA |\nEIN ENTREGA O ENVÍO. COLECCIÓN REVISADA Y TAL CUAL INDICA LA DESCRIPCIÓN |",
    "expected": {
      "price": 80,
      "editorial": "Navarrete",
      "year": 2003,
      "isOriginalHint": true,
      "titleIncludes": "LIGA DE LA JUSTICIA"
    }
  },
  {
    "file": "_6 VARIADO/SIN LICENCIA/MODERNAS/VITRINAvarm (0)A.jpg",
    "source": "ocr",
    "confidence": 66,
    "text": "..W. ... ...\n50 soles. Álbum STRANGER THINGS + set completo a pegar. Editorial 3 Reyes,\nAño 2026. (Cod. VR1111)\nÁ\n:\n| UN | E ! |\nr Y | nd 4 >” I , Cs\nsu e i | y / L Hi -\nExe | y | E | | | | E\n=====\nSmhunas\" | 2 EN AE , | ;\ne E E. :\nñ AMBIEN\n- 6\nE\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO.\nCOLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.\nh 4 Y Y . 4 Y Y uuu",
    "expected": {
      "price": 50,
      "code": "VR1111",
      "editorial": "3 Reyes",
      "year": 2026,
      "titleIncludes": "STRANGER THINGS"
    }
  },
  {
    "file": "_6 VARIADO/SIN LICENCIA/MODERNAS/VITRINAvarm (16).jpg",
    "source": "ocr",
    "confidence": 47,
    "text": ".u. .u.%. .u\nÁlbum SAJA BOYS 8: Las Guerreras K-Pop (2 en 1) + set\ncompleto a pegar / 50 SOLES año 2025 (Cod. VR1025)\n— —— ee ES > pr A eo EE M6 eZ E EST Er lie = MEZZO:\nSES a 'S FE te y eL 1\" ñ SN a 2 2 a ZN\n; TES OR ||| [e [ac NY ae\n1— | ON. ON DA Lp e me Le\n7 A | N » L ( Z » Z b b y > IN Er Ra\nNS =m EN — o PM 2100 O AY ZAS ZA\no\n=====\n— ——\nf i NENA Ms BRO |\n1 N ? DA 1 AP . ME.\nNe | | Ma y 4 U\n[A IN €  .- ES NA ,\na y AA L Le | - y\ne ELO yA ¡E al) ' | :\n2 da\nSOLO SE ACEPTAN RECLAMOS DE LOS 07 DÍAS MÁXIMO LUEGO DE LA ENTREGA\nO ENVÍO. COLECCIÓN REVISADA Y TAL CUAL INDICA LA DESCRIPCIÓN\nuu uns k 4 «4 Y <<",
    "expected": {
      "price": 50,
      "code": "VR1025",
      "year": 2025
    }
  },
  {
    "file": "_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (0)a.jpg",
    "source": "ocr",
    "confidence": 49,
    "text": "2 ... ... ...\n| 50 soles. EL PAIS DE INCA KOLA álbum + set completo a pegar +\ngoma pequeña + 4 postales. Réplica año 2000. (COD. VR1666)\n3 .\ns\n| | |. |: AQ 1 In NO HN a Y E” 1\n¡A CAES | A Go IES e E:\nNENE | Un e | 6 MANE: a\n= MING e Zo 1D re N Ur LN | ¿ y y ; \"E el\nE EN REY A A AMACAS | *» | PD Al.\n=====\n) | Ue : >“ E £ LAS 6 _— YU emana 1\nE , MS y Yu Y q — 7 ASENTEN\nR ” 44 Ly E e e >| E.\nS NA Y I \" , _ a NUEZ\n— - A 4 Y. Y UR Ati y “uo\n- = ÚRICO Irizar Y ES E Y — e\na ÁLBUM HIST E E VAL a EE > ———\ne No — PI -—<-—E “ — Y <\nE y\nr g SOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA\nENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.\nA\nA\nth € Y Y t 4 4 k «4 Y Y",
    "expected": {
      "price": 50,
      "code": "VR1666",
      "year": 2000,
      "isOriginalHint": false,
      "titleIncludes": "INCA KOLA"
    }
  },
  {
    "file": "_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (40).jpg",
    "source": "ocr",
    "confidence": 46,
    "text": "y » ..w. ... ...\nAlbum INUYASHA + set completo a pegar - 50 soles\na | | y | Ni _ ao, Mulero <a\n| g | [) N ra A | _“\n, | O j —“ va | la a | y | | uE ; KK 4 | e yA L\nmm A “E 7\na E 7 e.\n—— pee nai | 7 om MIROKU a SANGO-— Y: Y KRARA N; 1,\n1 2 r ÉL + , ds\n> | FE a O a\n=====\nETC AS ÉS Ó-—= —<\nIAN) u- Ar CIA A “a E\n44 NENE o De Aa | LM\n> MN | \" N NA | = af |\nley! Ue | y | | | i\" 4 [| Y | N NE 11 1] -\n- A ¿UB (UL DE E: UY E 1 E a \"A\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA\nuu. ENTREGA O ENVÍO. COLECCIÓN REVISADA Y TAL CUAL INDICA LA DESCRIPCIÓN",
    "expected": {
      "price": 50,
      "code": null,
      "warningsInclude": [
        "code_missing"
      ],
      "titleIncludes": "INUYASHA"
    }
  }
]
