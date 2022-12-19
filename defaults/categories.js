const defaultCategories = [
    { id: "category_1gjugdla10fd535b274f80f", name: "Abonnements / Factures", parentId: null },
    {
        id: "category_1gjugdla1019480d3252e4d",
        name: "Assurances habitation",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    { id: "category_1gjugdla10ea8d901d2d68", name: "Charges", parentId: "category_1gjugdla10fd535b274f80f" },
    {
        id: "category_1gjugdla105a5f6d5335134",
        name: "Chauffage",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    { id: "category_1gjugdla10155db94b1e38f", name: "Eau", parentId: "category_1gjugdla10fd535b274f80f" },
    {
        id: "category_1gjugdla107a6cf66adc0be",
        name: "Electricité",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla1060c8d61ff35d7",
        name: "Internet",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    { id: "category_1gjugdla10a2c69370c57c9", name: "Loyer", parentId: "category_1gjugdla10fd535b274f80f" },
    { id: "category_1gjugdla10bc1076fc3ca57", name: "Ménage", parentId: "category_1gjugdla10fd535b274f80f" },
    {
        id: "category_1gjugdla107df6bac640a01",
        name: "Portable",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla109561cca90ec0f",
        name: "Rembourssement crédit à la consommation",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla1028e68b80e313",
        name: "Rembourssement prêt immobilier",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla1001a3d97849813",
        name: "Salarié à domicile",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla10536ae2f45f495",
        name: "Service d'entretien",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla1090181585a20ef",
        name: "Téléphone",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla10909a8ca7d0349",
        name: "TV / Cable",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    {
        id: "category_1gjugdla10133744276bbac",
        name: "Abonnements / Factures",
        parentId: "category_1gjugdla10fd535b274f80f"
    },
    { id: "category_1gjugdla10ab557251f1f6", name: "Alimentation", parentId: null },
    {
        id: "category_1gjugdla10351cf91afd26e",
        name: "Café / Bar",
        parentId: "category_1gjugdla10ab557251f1f6"
    },
    { id: "category_1gjugdla1051eb2b9f45dff", name: "Epicerie", parentId: "category_1gjugdla10ab557251f1f6" },
    {
        id: "category_1gjugdla10ab67c39f2046e",
        name: "Restaurant",
        parentId: "category_1gjugdla10ab557251f1f6"
    },
    { id: "category_1gjugdla10afa13aaa5b5f8", name: "Courses", parentId: "category_1gjugdla10ab557251f1f6" },
    {
        id: "category_1gjugdla10f496cfe0a0693",
        name: "Grandes surfaces",
        parentId: "category_1gjugdla10ab557251f1f6"
    },
    { id: "category_1gjugdla10f88b614779735", name: "Animaux domestiques", parentId: null },
    {
        id: "category_1gjugdla102d0e6c422789a",
        name: "Alimentation",
        parentId: "category_1gjugdla10f88b614779735"
    },
    {
        id: "category_1gjugdla10dd0164110807b",
        name: "Fournitures diverses",
        parentId: "category_1gjugdla10f88b614779735"
    },
    {
        id: "category_1gjugdla107e5f831ca1e6f",
        name: "Frais de garde",
        parentId: "category_1gjugdla10f88b614779735"
    },
    {
        id: "category_1gjugdla1031e59925765f3",
        name: "Vatérinaire",
        parentId: "category_1gjugdla10f88b614779735"
    },
    { id: "category_1gjugdla104c02a807712bd", name: "Auto / Moto", parentId: null },
    {
        id: "category_1gjugdla10773ed015b3bfa",
        name: "Accessoires",
        parentId: "category_1gjugdla104c02a807712bd"
    },
    {
        id: "category_1gjugdla10c97cd1e48168e",
        name: "Assurance",
        parentId: "category_1gjugdla104c02a807712bd"
    },
    {
        id: "category_1gjugdla10483fd7ecfb121",
        name: "Carburant",
        parentId: "category_1gjugdla104c02a807712bd"
    },
    {
        id: "category_1gjugdla10653e6fc8fa52e",
        name: "Entretien / Réparation",
        parentId: "category_1gjugdla104c02a807712bd"
    },
    {
        id: "category_1gjugdla1002b8ec5f7285c",
        name: "Parking / Péage",
        parentId: "category_1gjugdla104c02a807712bd"
    },
    {
        id: "category_1gjugdla10ad8a0ea892f0e",
        name: "Rembourssement de prêt",
        parentId: "category_1gjugdla104c02a807712bd"
    },
    { id: "category_1gjugdla100ed65ddb3bf77", name: "Divers", parentId: null },
    { id: "category_1gjugdla1037d87d2908ffe", name: "Cadeaux", parentId: "category_1gjugdla100ed65ddb3bf77" },
    {
        id: "category_1gjugdla10eb4869a48cabb",
        name: "Dons caritatifs",
        parentId: "category_1gjugdla100ed65ddb3bf77"
    },
    {
        id: "category_1gjugdla10c1aa623a74318",
        name: "Responsabilité civile",
        parentId: "category_1gjugdla100ed65ddb3bf77"
    },
    {
        id: "category_1gjugdla1019822866c06d7",
        name: "Retrait d'espèces",
        parentId: "category_1gjugdla100ed65ddb3bf77"
    },
    { id: "category_1gjugdla109ff8de8fa1f18", name: "Enfants", parentId: null },
    {
        id: "category_1gjugdla10d3d5dcab5ed2b",
        name: "Activité sportive / culturelle",
        parentId: "category_1gjugdla109ff8de8fa1f18"
    },
    {
        id: "category_1gjugdla109a20cfac1bd75",
        name: "Assurance scolaire",
        parentId: "category_1gjugdla109ff8de8fa1f18"
    },
    {
        id: "category_1gjugdla104d489a097b5ba",
        name: "Frais de cantine",
        parentId: "category_1gjugdla109ff8de8fa1f18"
    },
    {
        id: "category_1gjugdla100f0b2bb0c62b6",
        name: "Frais de garde",
        parentId: "category_1gjugdla109ff8de8fa1f18"
    },
    {
        id: "category_1gjugdla10f209eb6094f7f",
        name: "Frais de scolarité",
        parentId: "category_1gjugdla109ff8de8fa1f18"
    },
    {
        id: "category_1gjugdla10e8da762bb1908",
        name: "Frais divers",
        parentId: "category_1gjugdla109ff8de8fa1f18"
    },
    {
        id: "category_1gjugdla10b1f52b564d769",
        name: "Rembourssement prêt étudiant",
        parentId: "category_1gjugdla109ff8de8fa1f18"
    },
    { id: "category_1gjugdla104c2a962a0bcfd", name: "Epargne", parentId: null },
    {
        id: "category_1gjugdla101bc02dcc3fdc9",
        name: "Assurance vie",
        parentId: "category_1gjugdla104c2a962a0bcfd"
    },
    {
        id: "category_1gjugdla10e03d596faf92f",
        name: "Livret / Divers",
        parentId: "category_1gjugdla104c2a962a0bcfd"
    },
    { id: "category_1gjugdla10e7a79c38b52ab", name: "Equipement du logement", parentId: null },
    {
        id: "category_1gjugdla10f41ec1e7080e8",
        name: "Ameublement",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    {
        id: "category_1gjugdla10dc4b919fe58b4",
        name: "Bricolage / Outils",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    {
        id: "category_1gjugdla10da196de49853",
        name: "Electroménager",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    {
        id: "category_1gjugdla10eac767d92b317",
        name: "Jardinage",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    {
        id: "category_1gjugdla10e60d95ada70f8",
        name: "Ordinateur et accessoires",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    {
        id: "category_1gjugdla10f08213f891cfa",
        name: "Rembourssement de crédit à la consommation",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    {
        id: "category_1gjugdla106ed0a4f0be53b",
        name: "Télévision et accessoires",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    {
        id: "category_1gjugdla10979aec1390285",
        name: "Travaux / Décoration",
        parentId: "category_1gjugdla10e7a79c38b52ab"
    },
    { id: "category_1gjugdla108848cce205f1", name: "Frais bancaires", parentId: null },
    { id: "category_1gjugdla104ae4d4aa6df72", name: "Agios", parentId: "category_1gjugdla108848cce205f1" },
    {
        id: "category_1gjugdla101b5fa3b3e7b57",
        name: "Carte de paiement",
        parentId: "category_1gjugdla108848cce205f1"
    },
    {
        id: "category_1gjugdla10424eba27ebcbc",
        name: "Carte de crédit",
        parentId: "category_1gjugdla108848cce205f1"
    },
    {
        id: "category_1gjugdla1050ce1e13be563",
        name: "Frais divers",
        parentId: "category_1gjugdla108848cce205f1"
    },
    {
        id: "category_1gjugdla1038e73854cf2a6",
        name: "Intérêts versés",
        parentId: "category_1gjugdla108848cce205f1"
    },
    {
        id: "category_1gjugdla106e14dc0c7b9ca",
        name: "Service / Abonnement",
        parentId: "category_1gjugdla108848cce205f1"
    },
    { id: "category_1gjugdla10e33e016b9b9ca", name: "Frais professionnels", parentId: null },
    {
        id: "category_1gjugdla103295697f7fe56",
        name: "Non rembourssés",
        parentId: "category_1gjugdla10e33e016b9b9ca"
    },
    {
        id: "category_1gjugdla10eabce2762fc57",
        name: "Rembourssés",
        parentId: "category_1gjugdla10e33e016b9b9ca"
    },
    { id: "category_1gjugdla108a25a2a4188b", name: "Habillement", parentId: null },
    {
        id: "category_1gjugdla1008698cd1e1f8d",
        name: "Accessoires",
        parentId: "category_1gjugdla108a25a2a4188b"
    },
    {
        id: "category_1gjugdla102a56f3503538",
        name: "Chaussures",
        parentId: "category_1gjugdla108a25a2a4188b"
    },
    {
        id: "category_1gjugdla10f582f5af7b367",
        name: "Vétements",
        parentId: "category_1gjugdla108a25a2a4188b"
    },
    { id: "category_1gjugdla108f5c7aa110271", name: "Impôts", parentId: null },
    {
        id: "category_1gjugdla10f45b651d0baeb",
        name: "Autres impôts",
        parentId: "category_1gjugdla108f5c7aa110271"
    },
    {
        id: "category_1gjugdla101361cad0cdd1a",
        name: "Cotisations de la sécurité sociale",
        parentId: "category_1gjugdla108f5c7aa110271"
    },
    {
        id: "category_1gjugdla1028d54f9fdf279",
        name: "Impôts locaux",
        parentId: "category_1gjugdla108f5c7aa110271"
    },
    {
        id: "category_1gjugdla10ec7eadaf946a6",
        name: "Impôts sur le revenu",
        parentId: "category_1gjugdla108f5c7aa110271"
    },
    { id: "category_1gjugdla109e29e4b504c9d", name: "Loisirs / Culture / Sport", parentId: null },
    {
        id: "category_1gjugdla100bbb98f3d9d1c",
        name: "Activité sportive",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    {
        id: "category_1gjugdla10fe596ad796b8b",
        name: "Articles de sport",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    {
        id: "category_1gjugdla10219f2ba8fb468",
        name: "Achat CD/DVD",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    {
        id: "category_1gjugdla102084d1fe85fed",
        name: "Cinéma / Spectacle",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    { id: "category_1gjugdla101701082c35e5f", name: "Jeux", parentId: "category_1gjugdla109e29e4b504c9d" },
    {
        id: "category_1gjugdla10c723abe14cd3e",
        name: "Journaux",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    { id: "category_1gjugdla10a7fc1eefbdaa", name: "Livres", parentId: "category_1gjugdla109e29e4b504c9d" },
    {
        id: "category_1gjugdla1048836850b9da3",
        name: "Location vidéo",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    {
        id: "category_1gjugdla10baac90aba7237",
        name: "Manifestations sportives",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    {
        id: "category_1gjugdla1007b3dfeb38bc5",
        name: "Musé / Exposition",
        parentId: "category_1gjugdla109e29e4b504c9d"
    },
    { id: "category_1gjugdla10b387d61d318fa", name: "Santé", parentId: null },
    {
        id: "category_1gjugdla10d0e0c0c9a9261",
        name: "Complémentaire santé",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    {
        id: "category_1gjugdla10cd533f5c68301",
        name: "Dentiste",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    { id: "category_1gjugdla10397682498ae66", name: "Hôpital", parentId: "category_1gjugdla10b387d61d318fa" },
    {
        id: "category_1gjugdla10e3533e2eedf24",
        name: "SPécialiste",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    {
        id: "category_1gjugdla103da26fcf0f7d",
        name: "Kinésithérapeuthe",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    { id: "category_1gjugdla107952114f465fb", name: "Médecin", parentId: "category_1gjugdla10b387d61d318fa" },
    {
        id: "category_1gjugdla1048e4f6182955f",
        name: "Oculiste",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    {
        id: "category_1gjugdla10fe473d860a44c",
        name: "Pharmacie",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    {
        id: "category_1gjugdla105454f8bbee301",
        name: "Médecin généraliste",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    {
        id: "category_1gjugdla1023bf3d13595a6",
        name: "Psychiatre",
        parentId: "category_1gjugdla10b387d61d318fa"
    },
    { id: "category_1gjugdla10a4a3f9a6900fe", name: "Soin de la personne", parentId: null },
    {
        id: "category_1gjugdla10a0cb164faf22b",
        name: "Coiffeur / Esthétique",
        parentId: "category_1gjugdla10a4a3f9a6900fe"
    },
    {
        id: "category_1gjugdla106250a4cc70927",
        name: "Thalasso / Remise en forme",
        parentId: "category_1gjugdla10a4a3f9a6900fe"
    },
    { id: "category_1gjugdla108340ea83b672a", name: "Transport", parentId: null },
    { id: "category_1gjugdla10ed956a190aa9f", name: "Avion", parentId: "category_1gjugdla108340ea83b672a" },
    {
        id: "category_1gjugdla109f0305e3ad645",
        name: "Métro / Train",
        parentId: "category_1gjugdla108340ea83b672a"
    },
    {
        id: "category_1gjugdla10c554756f8447f",
        name: "Bus / Car",
        parentId: "category_1gjugdla108340ea83b672a"
    },
    {
        id: "category_1gjugdla10f52b675ef8759",
        name: "Taxis / Uber",
        parentId: "category_1gjugdla108340ea83b672a"
    },
    { id: "category_1gjugdla10b2c6730572f26", name: "Bateau", parentId: "category_1gjugdla108340ea83b672a" },
    { id: "category_1gjugdla107c04da77d3dbe", name: "Vacances", parentId: null },
    {
        id: "category_1gjugdla10976642b349197",
        name: "Alimentation / Restaurant",
        parentId: "category_1gjugdla107c04da77d3dbe"
    },
    {
        id: "category_1gjugdla10ca0d5042df7a2",
        name: "Assurance voyage",
        parentId: "category_1gjugdla107c04da77d3dbe"
    },
    { id: "category_1gjugdla1065d0ba71770c", name: "Divers", parentId: "category_1gjugdla107c04da77d3dbe" },
    {
        id: "category_1gjugdla10e017a09f943ab",
        name: "Excursions / Visites",
        parentId: "category_1gjugdla107c04da77d3dbe"
    },
    {
        id: "category_1gjugdla1091f6ba2863c43",
        name: "Location de voiture",
        parentId: "category_1gjugdla107c04da77d3dbe"
    },
    {
        id: "category_1gjugdla1022d952a670e18",
        name: "Logement",
        parentId: "category_1gjugdla107c04da77d3dbe"
    },
    { id: "category_1gjugdla1052680dc28f79a", name: "Séjours", parentId: "category_1gjugdla107c04da77d3dbe" },
    { id: "category_1gjugdla10297fe0b39d0f3", name: "Voyage", parentId: "category_1gjugdla107c04da77d3dbe" },
    {
        id: "category_1gjugdla10b89eeb871276e",
        name: "Croisière",
        parentId: "category_1gjugdla107c04da77d3dbe"
    },
    { id: "category_1gjugdla10ebcc58f45a363", name: "Revenus", parentId: null },
    {
        id: "category_1gjugdla10865a89aa10269",
        name: "Autre revenu",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    {
        id: "category_1gjugdla1092d7d3fe82689",
        name: "Arrêt maladie",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    {
        id: "category_1gjugdla1061b300ea7ca1b",
        name: "Accident du travail",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    {
        id: "category_1gjugdla103125018483567",
        name: "Allocation chomage",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    {
        id: "category_1gjugdla101b10f8970da37",
        name: "Allocation familliale",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    { id: "category_1gjugdla1011770a7685ccf", name: "Salaire", parentId: "category_1gjugdla10ebcc58f45a363" },
    { id: "category_1gjugdla10601b14d4f9c6", name: "Accompte", parentId: "category_1gjugdla10ebcc58f45a363" },
    {
        id: "category_1gjugdla100ad902f76a49f",
        name: "Capital de prêt reçu",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    {
        id: "category_1gjugdla101fc954ea16ef5",
        name: "Crédit d'impôts",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    {
        id: "category_1gjugdla10ee6681f6edbac",
        name: "Dons et Cadeaux",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    {
        id: "category_1gjugdla10672d2b2d050db",
        name: "Héritage",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    { id: "category_1gjugdla102e16094ebbce5", name: "Jeux", parentId: "category_1gjugdla10ebcc58f45a363" },
    {
        id: "category_1gjugdla10ea64db46bfbb6",
        name: "Option d'achat d'actions",
        parentId: "category_1gjugdla10ebcc58f45a363"
    },
    { id: "category_1gjugdla10406753082bc6", name: "Placements", parentId: null },
    {
        id: "category_1gjugdla1081249e564e861",
        name: "Dividendes",
        parentId: "category_1gjugdla10406753082bc6"
    },
    { id: "category_1gjugdla1031eaa9e152087", name: "Intérèts", parentId: "category_1gjugdla10406753082bc6" },
    {
        id: "category_1gjugdla10d1084ac38c4a3",
        name: "Plusvalues",
        parentId: "category_1gjugdla10406753082bc6"
    },
    {
        id: "category_1gjugdla10953662eba9e31",
        name: "Plusvalues immobillières",
        parentId: "category_1gjugdla10406753082bc6"
    },
    {
        id: "category_1gjugdla1067c5d647f7b8a",
        name: "Revenus locatifs",
        parentId: "category_1gjugdla10406753082bc6"
    },
    { id: "category_1gjugdla10156229cf23c8", name: "Retraite", parentId: null },
    { id: "category_1gjugdla1067e8cc2a9e15e", name: "Pension", parentId: "category_1gjugdla10156229cf23c8" },
    {
        id: "category_1gjugdla10b24c45818d327",
        name: "Régime général",
        parentId: "category_1gjugdla10156229cf23c8"
    },
    {
        id: "category_1gjugdla107f5ded55f21c",
        name: "Retraite complémentaire",
        parentId: "category_1gjugdla10156229cf23c8"
    },
    { id: "category_1gjugdla10cc5474028b748", name: "Traitements et Salaires", parentId: null },
    {
        id: "category_1gjugdla10b20402021b85c",
        name: "Commissions",
        parentId: "category_1gjugdla10cc5474028b748"
    },
    {
        id: "category_1gjugdla100b6cf0ea7973d",
        name: "Contributions employeur",
        parentId: "category_1gjugdla10cc5474028b748"
    },
    {
        id: "category_1gjugdla10c3091cf4c3655",
        name: "Heures supplémentaires",
        parentId: "category_1gjugdla10cc5474028b748"
    },
    {
        id: "category_1gjugdla103ccca7e9525fe",
        name: "Primes diverses",
        parentId: "category_1gjugdla10cc5474028b748"
    },
    {
        id: "category_1gjugdla105e9c7142b36b6",
        name: "Primes résultats",
        parentId: "category_1gjugdla10cc5474028b748"
    },
    {
        id: "category_1gjugdla101953d6f60662c",
        name: "Salaire net",
        parentId: "category_1gjugdla10cc5474028b748"
    },
    { id: "category_1gjugdla10ce24af13d6568", name: "Accompte", parentId: "category_1gjugdla10cc5474028b748" }
];

module.exports = { defaultCategories };
