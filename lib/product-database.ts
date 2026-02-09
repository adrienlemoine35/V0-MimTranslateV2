export type ProductLevel = "Rayon" | "Sous-Rayon" | "Regroupement" | "Modèle"
export type CharacteristicType = "ouvert" | "fermé"
export type AllLevels = ProductLevel | "Caractéristique" | "Valeur"

export interface ProductItem {
  id: string
  type: ProductLevel
  nameFr: string
  nameEn: string
  nameEs?: string
  nameIt?: string
  descriptionFr: string
  descriptionEn: string
  descriptionEs?: string
  descriptionIt?: string
  parentId: string | null
  path: string[] // Breadcrumb path
}

// Caracteristique - peut etre liee a plusieurs modeles
export interface Characteristic {
  id: string
  type: "Caractéristique"
  characteristicType: CharacteristicType // ouvert ou ferme
  nameFr: string
  nameEn: string
  nameEs?: string
  nameIt?: string
  descriptionFr: string
  descriptionEn: string
  descriptionEs?: string
  descriptionIt?: string
  modelIds: string[] // Many-to-many: liste des modeles associes
}

// Valeur - uniquement pour caracteristiques fermees, peut etre liee a plusieurs caracteristiques
export interface CharacteristicValue {
  id: string
  type: "Valeur"
  nameFr: string
  nameEn: string
  nameEs?: string
  nameIt?: string
  descriptionFr: string
  descriptionEn: string
  descriptionEs?: string
  descriptionIt?: string
  characteristicIds: string[] // Many-to-many: liste des caracteristiques associees
}

// Union type pour le tableau unifie
export interface UnifiedItem {
  id: string
  type: AllLevels
  nameFr: string
  nameEn: string
  nameEs?: string
  nameIt?: string
  descriptionFr: string
  descriptionEn: string
  descriptionEs?: string
  descriptionIt?: string
  characteristicType?: CharacteristicType
  linkedIds?: string[] // modelIds pour Caracteristique, characteristicIds pour Valeur
}

// Hierarchical structure for the filter
export interface CategoryNode {
  id: string
  nameFr: string
  level: AllLevels
  children: CategoryNode[]
  count?: number // For characteristics: number of models, for values: number of characteristics
  }

export const productDatabase: ProductItem[] = [
  // === RAYON 1: Matériaux de construction ===
  {
    id: "R001",
    type: "Rayon",
    nameFr: "Matériaux de construction",
    nameEn: "Building Materials",
    nameEs: "Materiales de construcción",
    nameIt: "Materiali da costruzione",
    descriptionFr: "Tous les matériaux nécessaires à la construction",
    descriptionEn: "All materials needed for construction",
    descriptionEs: "Todos los materiales necesarios para la construcción",
    descriptionIt: "Tutti i materiali necessari per la costruzione",
    parentId: null,
    path: ["Matériaux de construction"]
  },
  // Sous-Rayon
  {
    id: "SR001",
    type: "Sous-Rayon",
    nameFr: "Matériel de construction",
    nameEn: "Construction Equipment",
    nameEs: "Material de construcción",
    nameIt: "Materiale da costruzione",
    descriptionFr: "Équipements et outils pour la construction",
    descriptionEn: "Equipment and tools for construction",
    descriptionEs: "Equipos y herramientas para la construcción",
    descriptionIt: "Attrezzature e strumenti per la costruzione",
    parentId: "R001",
    path: ["Matériaux de construction", "Matériel de construction"]
  },
  {
    id: "SR002",
    type: "Sous-Rayon",
    nameFr: "Gros œuvre",
    nameEn: "Structural Work",
    nameEs: "Obra gruesa",
    nameIt: "Opera grezza",
    descriptionFr: "Matériaux pour le gros œuvre",
    descriptionEn: "Materials for structural work",
    descriptionEs: "Materiales para la obra gruesa",
    descriptionIt: "Materiali per l'opera grezza",
    parentId: "R001",
    path: ["Matériaux de construction", "Gros œuvre"]
  },
  // Regroupement
  {
    id: "RG001",
    type: "Regroupement",
    nameFr: "Bétonnière",
    nameEn: "Concrete Mixer",
    nameEs: "Hormigonera",
    nameIt: "Betoniera",
    descriptionFr: "Machines pour mélanger le béton",
    descriptionEn: "Machines for mixing concrete",
    descriptionEs: "Máquinas para mezclar hormigón",
    descriptionIt: "Macchine per mescolare il calcestruzzo",
    parentId: "SR001",
    path: ["Matériaux de construction", "Matériel de construction", "Bétonnière"]
  },
  {
    id: "RG002",
    type: "Regroupement",
    nameFr: "Échafaudage",
    nameEn: "Scaffolding",
    nameEs: "Andamio",
    nameIt: "Ponteggio",
    descriptionFr: "Structures temporaires pour travaux en hauteur",
    descriptionEn: "Temporary structures for working at height",
    descriptionEs: "Estructuras temporales para trabajos en altura",
    descriptionIt: "Strutture temporanee per lavori in altezza",
    parentId: "SR001",
    path: ["Matériaux de construction", "Matériel de construction", "Échafaudage"]
  },
  {
    id: "RG003",
    type: "Regroupement",
    nameFr: "Ciment et mortier",
    nameEn: "Cement and Mortar",
    nameEs: "Cemento y mortero",
    nameIt: "Cemento e malta",
    descriptionFr: "Liants hydrauliques pour construction",
    descriptionEn: "Hydraulic binders for construction",
    descriptionEs: "Aglutinantes hidráulicos para construcción",
    descriptionIt: "Leganti idraulici per costruzione",
    parentId: "SR002",
    path: ["Matériaux de construction", "Gros œuvre", "Ciment et mortier"]
  },
  // Modèle
  {
    id: "M001",
    type: "Modèle",
    nameFr: "Bétonnière électrique",
    nameEn: "Electric Concrete Mixer",
    nameEs: "Hormigonera eléctrica",
    nameIt: "Betoniera elettrica",
    descriptionFr: "Bétonnière alimentée par électricité",
    descriptionEn: "Electrically powered concrete mixer",
    descriptionEs: "Hormigonera alimentada por electricidad",
    descriptionIt: "Betoniera alimentata elettricamente",
    parentId: "RG001",
    path: ["Matériaux de construction", "Matériel de construction", "Bétonnière", "Bétonnière électrique"]
  },
  {
    id: "M002",
    type: "Modèle",
    nameFr: "Bétonnière thermique",
    nameEn: "Gas-Powered Concrete Mixer",
    nameEs: "Hormigonera térmica",
    nameIt: "Betoniera termica",
    descriptionFr: "Bétonnière avec moteur thermique",
    descriptionEn: "Gas-powered concrete mixer",
    descriptionEs: "Hormigonera con motor térmico",
    descriptionIt: "Betoniera con motore termico",
    parentId: "RG001",
    path: ["Matériaux de construction", "Matériel de construction", "Bétonnière", "Bétonnière thermique"]
  },
  {
    id: "M003",
    type: "Modèle",
    nameFr: "Échafaudage roulant",
    nameEn: "Mobile Scaffolding",
    nameEs: "Andamio móvil",
    nameIt: "Ponteggio mobile",
    descriptionFr: "Échafaudage avec roues pour déplacement facile",
    descriptionEn: "Scaffolding with wheels for easy movement",
    descriptionEs: "Andamio con ruedas para facilitar el movimiento",
    descriptionIt: "Ponteggio con ruote per spostamento facile",
    parentId: "RG002",
    path: ["Matériaux de construction", "Matériel de construction", "Échafaudage", "Échafaudage roulant"]
  },
  {
    id: "M002",
    type: "Modèle",
    nameFr: "",
    nameEn: "Thermal Concrete Mixer",
    nameEs: "",
    nameIt: "",
    descriptionFr: "",
    descriptionEn: "Thermal engine concrete mixer",
    descriptionEs: "",
    descriptionIt: "",
    parentId: "RG001",
    path: ["Matériaux de construction", "Matériel de construction", "Bétonnière", "Bétonnière thermique"]
  },
  {
    id: "M003",
    type: "Modèle",
    nameFr: "Échafaudage roulant",
    nameEn: "Rolling Scaffolding",
    nameEs: "Andamio rodante",
    nameIt: "Ponteggio rotante",
    descriptionFr: "Échafaudage mobile sur roulettes",
    descriptionEn: "Mobile scaffolding on wheels",
    descriptionEs: "Andamio móvil sobre ruedas",
    descriptionIt: "Ponteggio mobile su ruote",
    parentId: "RG002",
    path: ["Matériaux de construction", "Matériel de construction", "Échafaudage", "Échafaudage roulant"]
  },
  {
    id: "M004",
    type: "Modèle",
    nameFr: "Ciment Portland",
    nameEn: "Portland Cement",
    nameEs: "Cemento Portland",
    nameIt: "Cemento Portland",
    descriptionFr: "Ciment standard pour usage courant",
    descriptionEn: "Standard cement for common use",
    descriptionEs: "Cemento estándar para uso común",
    descriptionIt: "Cemento standard per uso comune",
    parentId: "RG003",
    path: ["Matériaux de construction", "Gros œuvre", "Ciment et mortier", "Ciment Portland"]
  },


  // === RAYON 2: Jardin - Aménagement extérieur ===
  {
    id: "R002",
    type: "Rayon",
    nameFr: "Jardin - Aménagement extérieur",
    nameEn: "Garden - Outdoor Landscaping",
    nameEs: "Jardín - Paisajismo exterior",
    nameIt: "Giardino - Paesaggistica esterna",
    descriptionFr: "Tout pour l'aménagement et l'entretien du jardin",
    descriptionEn: "Everything for garden landscaping and maintenance",
    descriptionEs: "Todo para el paisajismo y mantenimiento del jardín",
    descriptionIt: "Tutto per la paesaggistica e la manutenzione del giardino",
    parentId: null,
    path: ["Jardin - Aménagement extérieur"]
  },
  // Sous-Rayon
  {
    id: "SR003",
    type: "Sous-Rayon",
    nameFr: "Outillage et entretien du terrain",
    nameEn: "Tools and Land Maintenance",
    nameEs: "Herramientas y mantenimiento del terreno",
    nameIt: "Attrezzi e manutenzione del terreno",
    descriptionFr: "Outils pour l'entretien des espaces verts",
    descriptionEn: "Tools for green space maintenance",
    descriptionEs: "Herramientas para el mantenimiento de espacios verdes",
    descriptionIt: "Attrezzi per la manutenzione di spazi verdi",
    parentId: "R002",
    path: ["Jardin - Aménagement extérieur", "Outillage et entretien du terrain"]
  },
  {
    id: "SR004",
    type: "Sous-Rayon",
    nameFr: "Arrosage et récupération d'eau",
    nameEn: "Watering and Water Recovery",
    nameEs: "Riego y recuperación de agua",
    nameIt: "Irrigazione e recupero dell'acqua",
    descriptionFr: "Systèmes d'arrosage et récupération d'eau de pluie",
    descriptionEn: "Watering systems and rainwater recovery",
    descriptionEs: "Sistemas de riego y recuperación de agua de lluvia",
    descriptionIt: "Sistemi di irrigazione e recupero dell'acqua piovana",
    parentId: "R002",
    path: ["Jardin - Aménagement extérieur", "Arrosage et récupération d'eau"]
  },
  // Regroupement
  {
    id: "RG004",
    type: "Regroupement",
    nameFr: "Taille du bois et de la haie",
    nameEn: "Wood and Hedge Trimming",
    descriptionFr: "Outils pour tailler arbres et haies",
    descriptionEn: "Tools for trimming trees and hedges",
    parentId: "SR003",
    path: ["Jardin - Aménagement extérieur", "Outillage et entretien du terrain", "Taille du bois et de la haie"]
  },
  {
    id: "RG005",
    type: "Regroupement",
    nameFr: "Coupe du bois",
    nameEn: "Wood Cutting",
    descriptionFr: "Outils pour couper le bois",
    descriptionEn: "Tools for cutting wood",
    parentId: "SR003",
    path: ["Jardin - Aménagement extérieur", "Outillage et entretien du terrain", "Coupe du bois"]
  },
  {
    id: "RG006",
    type: "Regroupement",
    nameFr: "Tuyaux et raccords",
    nameEn: "Hoses and Fittings",
    descriptionFr: "Tuyaux d'arrosage et accessoires",
    descriptionEn: "Garden hoses and accessories",
    parentId: "SR004",
    path: ["Jardin - Aménagement extérieur", "Arrosage et récupération d'eau", "Tuyaux et raccords"]
  },
  // Modèle
  {
    id: "M005",
    type: "Modèle",
    nameFr: "Sécateur manuel",
    nameEn: "Manual Pruner",
    descriptionFr: "Sécateur à main pour petites branches",
    descriptionEn: "Hand pruner for small branches",
    parentId: "RG004",
    path: ["Jardin - Aménagement extérieur", "Outillage et entretien du terrain", "Taille du bois et de la haie", "Sécateur manuel"]
  },
  {
    id: "M006",
    type: "Modèle",
    nameFr: "",
    nameEn: "Electric Hedge Trimmer",
    descriptionFr: "",
    descriptionEn: "Electrically powered hedge trimmer",
    parentId: "RG004",
    path: ["Jardin - Aménagement extérieur", "Outillage et entretien du terrain", "Taille du bois et de la haie", "Taille-haie électrique"]
  },
  {
    id: "M007",
    type: "Modèle",
    nameFr: "Scie arboricole",
    nameEn: "Arborist Saw",
    descriptionFr: "Scie spécialisée pour élagage des arbres",
    descriptionEn: "Specialized saw for tree pruning",
    parentId: "RG005",
    path: ["Jardin - Aménagement extérieur", "Outillage et entretien du terrain", "Coupe du bois", "Scie arboricole"]
  },
  {
    id: "M008",
    type: "Modèle",
    nameFr: "Tronçonneuse thermique",
    nameEn: "Gas Chainsaw",
    descriptionFr: "Tronçonneuse à moteur essence",
    descriptionEn: "Gasoline-powered chainsaw",
    parentId: "RG005",
    path: ["Jardin - Aménagement extérieur", "Outillage et entretien du terrain", "Coupe du bois", "Tronçonneuse thermique"]
  },
  {
    id: "M009",
    type: "Modèle",
    nameFr: "Tuyau extensible",
    nameEn: "Expandable Hose",
    descriptionFr: "Tuyau d'arrosage extensible et rétractable",
    descriptionEn: "Expandable and retractable garden hose",
    parentId: "RG006",
    path: ["Jardin - Aménagement extérieur", "Arrosage et récupération d'eau", "Tuyaux et raccords", "Tuyau extensible"]
  },


  // === RAYON 3: Électricité ===
  {
    id: "R003",
    type: "Rayon",
    nameFr: "Électricité",
    nameEn: "Electrical",
    descriptionFr: "Matériel électrique et domotique",
    descriptionEn: "Electrical equipment and home automation",
    parentId: null,
    path: ["Électricité"]
  },
  // Sous-Rayon
  {
    id: "SR005",
    type: "Sous-Rayon",
    nameFr: "Câbles et fils",
    nameEn: "Cables and Wires",
    descriptionFr: "Câblage électrique pour installations",
    descriptionEn: "Electrical wiring for installations",
    parentId: "R003",
    path: ["Électricité", "Câbles et fils"]
  },
  {
    id: "SR006",
    type: "Sous-Rayon",
    nameFr: "Appareillage électrique",
    nameEn: "Electrical Equipment",
    descriptionFr: "Interrupteurs, prises et accessoires",
    descriptionEn: "Switches, outlets and accessories",
    parentId: "R003",
    path: ["Électricité", "Appareillage électrique"]
  },
  // Regroupement
  {
    id: "RG007",
    type: "Regroupement",
    nameFr: "Câbles domestiques",
    nameEn: "Domestic Cables",
    descriptionFr: "Câbles pour installation résidentielle",
    descriptionEn: "Cables for residential installation",
    parentId: "SR005",
    path: ["Électricité", "Câbles et fils", "Câbles domestiques"]
  },
  {
    id: "RG008",
    type: "Regroupement",
    nameFr: "Interrupteurs",
    nameEn: "Switches",
    descriptionFr: "Dispositifs de commande d'éclairage",
    descriptionEn: "Lighting control devices",
    parentId: "SR006",
    path: ["Électricité", "Appareillage électrique", "Interrupteurs"]
  },
  // Modèle
  {
    id: "M010",
    type: "Modèle",
    nameFr: "Câble H07V-U 2.5mm²",
    nameEn: "H07V-U 2.5mm² Cable",
    descriptionFr: "Câble rigide pour circuit prises",
    descriptionEn: "Rigid cable for outlet circuits",
    parentId: "RG007",
    path: ["Électricité", "Câbles et fils", "Câbles domestiques", "Câble H07V-U 2.5mm²"]
  },
  {
    id: "M011",
    type: "Modèle",
    nameFr: "",
    nameEn: "Two-Way Switch",
    descriptionFr: "",
    descriptionEn: "Switch for control from two points",
    parentId: "RG008",
    path: ["Électricité", "Appareillage électrique", "Interrupteurs", "Interrupteur va-et-vient"]
  },
  {
    id: "M012",
    type: "Modèle",
    nameFr: "Interrupteur connecté",
    nameEn: "Smart Switch",
    descriptionFr: "Interrupteur pilotable à distance",
    descriptionEn: "Remotely controllable switch",
    parentId: "RG008",
    path: ["Électricité", "Appareillage électrique", "Interrupteurs", "Interrupteur connecté"]
  },


  // === RAYON 4: Plomberie ===
  {
    id: "R004",
    type: "Rayon",
    nameFr: "Plomberie",
    nameEn: "Plumbing",
    descriptionFr: "Équipements et fournitures de plomberie",
    descriptionEn: "Plumbing equipment and supplies",
    parentId: null,
    path: ["Plomberie"]
  },
  // Sous-Rayon
  {
    id: "SR007",
    type: "Sous-Rayon",
    nameFr: "Robinetterie",
    nameEn: "Faucets",
    descriptionFr: "Robinets et mitigeurs",
    descriptionEn: "Taps and mixers",
    parentId: "R004",
    path: ["Plomberie", "Robinetterie"]
  },
  // Regroupement
  {
    id: "RG009",
    type: "Regroupement",
    nameFr: "",
    nameEn: "Kitchen Mixers",
    descriptionFr: "",
    descriptionEn: "Mixer taps for kitchen",
    parentId: "SR007",
    path: ["Plomberie", "Robinetterie", "Mitigeurs cuisine"]
  },
  // Modèle
  {
    id: "M013",
    type: "Modèle",
    nameFr: "Mitigeur évier douchette",
    nameEn: "Sink Mixer with Spray",
    descriptionFr: "",
    descriptionEn: "Mixer with pull-out spray",
    parentId: "RG009",
    path: ["Plomberie", "Robinetterie", "Mitigeurs cuisine", "Mitigeur évier douchette"]
  },


  // === RAYON 5: Peinture ===
  {
    id: "R005",
    type: "Rayon",
    nameFr: "Peinture",
    nameEn: "Paint",
    descriptionFr: "Peintures et produits de finition",
    descriptionEn: "Paints and finishing products",
    parentId: null,
    path: ["Peinture"]
  },
  {
    id: "SR008",
    type: "Sous-Rayon",
    nameFr: "",
    nameEn: "Interior Paint",
    descriptionFr: "",
    descriptionEn: "Paints for indoor walls and ceilings",
    parentId: "R005",
    path: ["Peinture", "Peinture intérieure"]
  },
  {
    id: "SR009",
    type: "Sous-Rayon",
    nameFr: "Peinture extérieure",
    nameEn: "Exterior Paint",
    descriptionFr: "Peintures résistantes aux intempéries",
    descriptionEn: "Weather-resistant outdoor paints",
    parentId: "R005",
    path: ["Peinture", "Peinture extérieure"]
  },
  {
    id: "RG010",
    type: "Regroupement",
    nameFr: "",
    nameEn: "Wall Paint",
    descriptionFr: "",
    descriptionEn: "Paint specifically formulated for walls",
    parentId: "SR008",
    path: ["Peinture", "Peinture intérieure", "Peinture murale"]
  },
  {
    id: "RG011",
    type: "Regroupement",
    nameFr: "Peinture plafond",
    nameEn: "Ceiling Paint",
    descriptionFr: "",
    descriptionEn: "Non-drip paint designed for ceiling application",
    parentId: "SR008",
    path: ["Peinture", "Peinture intérieure", "Peinture plafond"]
  },
  {
    id: "RG012",
    type: "Regroupement",
    nameFr: "Peinture façade",
    nameEn: "Facade Paint",
    descriptionFr: "Peinture pour murs extérieurs",
    descriptionEn: "Paint for exterior walls",
    parentId: "SR009",
    path: ["Peinture", "Peinture extérieure", "Peinture façade"]
  },
  {
    id: "M014",
    type: "Modèle",
    nameFr: "",
    nameEn: "Matte Acrylic Paint",
    descriptionFr: "",
    descriptionEn: "Water-based acrylic paint with matte finish",
    parentId: "RG010",
    path: ["Peinture", "Peinture intérieure", "Peinture murale", "Peinture acrylique mate"]
  },
  {
    id: "M015",
    type: "Modèle",
    nameFr: "",
    nameEn: "Satin Finish Paint",
    descriptionFr: "",
    descriptionEn: "Washable paint with satin sheen for high-traffic areas",
    parentId: "RG010",
    path: ["Peinture", "Peinture intérieure", "Peinture murale", "Peinture satinée"]
  },
  {
    id: "M016",
    type: "Modèle",
    nameFr: "Peinture glycéro brillante",
    nameEn: "Gloss Oil Paint",
    descriptionFr: "",
    descriptionEn: "Solvent-based paint with high gloss finish for woodwork",
    parentId: "RG010",
    path: ["Peinture", "Peinture intérieure", "Peinture murale", "Peinture glycéro brillante"]
  },
  {
    id: "M017",
    type: "Modèle",
    nameFr: "",
    nameEn: "Anti-Stain Ceiling Paint",
    descriptionFr: "",
    descriptionEn: "Special formula that blocks stains and yellowing on ceilings",
    parentId: "RG011",
    path: ["Peinture", "Peinture intérieure", "Peinture plafond", "Peinture plafond anti-tache"]
  },


  // === RAYON 6: Outillage à main ===
  {
    id: "R006",
    type: "Rayon",
    nameFr: "Outillage à main",
    nameEn: "Hand Tools",
    descriptionFr: "Outils manuels pour tous travaux",
    descriptionEn: "Manual tools for all types of work",
    parentId: null,
    path: ["Outillage à main"]
  },
  {
    id: "SR010",
    type: "Sous-Rayon",
    nameFr: "",
    nameEn: "Screwdrivers and Wrenches",
    descriptionFr: "",
    descriptionEn: "Tools for tightening and loosening fasteners",
    parentId: "R006",
    path: ["Outillage à main", "Tournevis et clés"]
  },
  {
    id: "SR011",
    type: "Sous-Rayon",
    nameFr: "Marteaux et massettes",
    nameEn: "Hammers and Mallets",
    descriptionFr: "",
    descriptionEn: "Striking tools for driving nails and shaping materials",
    parentId: "R006",
    path: ["Outillage à main", "Marteaux et massettes"]
  },
  {
    id: "RG013",
    type: "Regroupement",
    nameFr: "",
    nameEn: "Screwdriver Sets",
    descriptionFr: "",
    descriptionEn: "Complete sets of screwdrivers in various sizes and types",
    parentId: "SR010",
    path: ["Outillage à main", "Tournevis et clés", "Jeux de tournevis"]
  },
  {
    id: "RG014",
    type: "Regroupement",
    nameFr: "Clés plates",
    nameEn: "Open-End Wrenches",
    descriptionFr: "",
    descriptionEn: "Wrenches with open ends for hexagonal bolts and nuts",
    parentId: "SR010",
    path: ["Outillage à main", "Tournevis et clés", "Clés plates"]
  },
  {
    id: "RG015",
    type: "Regroupement",
    nameFr: "",
    nameEn: "Claw Hammers",
    descriptionFr: "",
    descriptionEn: "Hammers with nail-pulling claw for carpentry work",
    parentId: "SR011",
    path: ["Outillage à main", "Marteaux et massettes", "Marteaux arrache-clous"]
  },
  {
    id: "M018",
    type: "Modèle",
    nameFr: "",
    nameEn: "Precision Screwdriver Set",
    descriptionFr: "",
    descriptionEn: "Small screwdrivers for electronics and fine mechanical work",
    parentId: "RG013",
    path: ["Outillage à main", "Tournevis et clés", "Jeux de tournevis", "Tournevis précision"]
  },
  {
    id: "M019",
    type: "Modèle",
    nameFr: "Tournevis isolé 1000V",
    nameEn: "Insulated Screwdriver 1000V",
    descriptionFr: "",
    descriptionEn: "Electrically insulated screwdriver rated for 1000 volts",
    parentId: "RG013",
    path: ["Outillage à main", "Tournevis et clés", "Jeux de tournevis", "Tournevis isolé 1000V"]
  },
  {
    id: "M020",
    type: "Modèle",
    nameFr: "",
    nameEn: "Fiberglass Handle Hammer",
    descriptionFr: "",
    descriptionEn: "Durable hammer with shock-absorbing fiberglass handle",
    parentId: "RG015",
    path: ["Outillage à main", "Marteaux et massettes", "Marteaux arrache-clous", "Marteau manche fibre"]
  },
]

// === CARACTERISTIQUES (many-to-many avec Modeles) ===
export const characteristicsDatabase: Characteristic[] = [
  // Marque
  {
    id: "CAR001",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Marque",
    nameEn: "Brand",
    descriptionFr: "Fabricant du produit",
    descriptionEn: "Product manufacturer",
    modelIds: ["M001", "M002", "M003", "M005", "M006", "M008", "M010", "M014", "M018", "M020"]
  },
  {
    id: "CAR002",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Couleur",
    nameEn: "Color",
    descriptionFr: "Couleur du produit",
    descriptionEn: "Product color",
    modelIds: ["M014", "M015", "M016", "M017", "M009", "M013"] // Added M013 (Mitigeur) with color options
  },
  {
    id: "CAR003",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Puissance",
    nameEn: "Power",
    descriptionFr: "Puissance électrique ou mécanique",
    descriptionEn: "Electrical or mechanical power output",
    modelIds: ["M001", "M002", "M003", "M007", "M008", "M009", "M010", "M011", "M019", "M020"]
  },
  {
    id: "CAR004",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Capacité",
    nameEn: "Capacity",
    descriptionFr: "",
    descriptionEn: "Volume or load capacity",
    modelIds: ["M001", "M002"]
  },
  {
    id: "CAR005",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Matériau",
    nameEn: "Material",
    descriptionFr: "Composition matérielle principale",
    descriptionEn: "Primary material composition",
    modelIds: ["M001", "M002", "M003", "M019", "M020"]
  },
  {
    id: "CAR006",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Pays de fabrication",
    nameEn: "Country of Origin",
    descriptionFr: "Pays où le produit est fabriqué",
    descriptionEn: "Country where the product is manufactured",
    modelIds: ["M001", "M005", "M010", "M018"]
  },
  {
    id: "CAR007",
    type: "Caractéristique",
    characteristicType: "ouvert",
    nameFr: "",
    nameEn: "Technical Reference",
    descriptionFr: "",
    descriptionEn: "Manufacturer technical reference number",
    modelIds: ["M010", "M011", "M012", "M013"]
  },
  {
    id: "CAR008",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Taille",
    nameEn: "Size",
    descriptionFr: "Dimensions ou taille du produit",
    descriptionEn: "Product dimensions or size",
    modelIds: ["M005", "M007", "M009", "M018", "M019"]
  },
  {
    id: "CAR009",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "",
    nameEn: "Voltage Rating",
    descriptionFr: "",
    descriptionEn: "Maximum voltage the product can handle",
    modelIds: ["M010", "M011", "M012", "M019"]
  },
  {
    id: "CAR010",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Finition",
    nameEn: "Finish",
    descriptionFr: "Type de finition de surface",
    descriptionEn: "Surface finish type",
    modelIds: ["M013", "M014", "M015", "M016", "M019", "M020"] // Added tools with finish options
  },
  {
    id: "CAR011",
    type: "Caractéristique",
    characteristicType: "ouvert",
    nameFr: "Garantie",
    nameEn: "Warranty",
    descriptionFr: "",
    descriptionEn: "Warranty period and conditions",
    modelIds: ["M001", "M002", "M006", "M008", "M012"]
  },
  {
    id: "CAR012",
    type: "Caractéristique",
    characteristicType: "fermé",
    nameFr: "Classe de poids",
    nameEn: "Weight Class",
    descriptionFr: "Catégorie de poids du produit",
    descriptionEn: "Product weight category",
    modelIds: ["M001", "M002", "M003", "M008", "M020"]
  },
]

// === VALEURS (many-to-many avec Caracteristiques fermees) ===
export const valuesDatabase: CharacteristicValue[] = [
  // Valeurs pour Marque (CAR001)
  {
    id: "VAL001",
    type: "Valeur",
    nameFr: "Bosch",
    nameEn: "Bosch",
    descriptionFr: "Marque allemande d'outillage",
    descriptionEn: "German tool brand",
    characteristicIds: ["CAR001"]
  },
  {
    id: "VAL002",
    type: "Valeur",
    nameFr: "Makita",
    nameEn: "Makita",
    descriptionFr: "Marque japonaise d'outillage professionnel",
    descriptionEn: "Japanese professional tool brand",
    characteristicIds: ["CAR001"]
  },
  {
    id: "VAL003",
    type: "Valeur",
    nameFr: "DeWalt",
    nameEn: "DeWalt",
    descriptionFr: "Fabricant américain d'outils électriques",
    descriptionEn: "American power tool manufacturer",
    characteristicIds: ["CAR001"]
  },
  {
    id: "VAL004",
    type: "Valeur",
    nameFr: "Stanley",
    nameEn: "Stanley",
    descriptionFr: "Fabricant américain d'outils à main et rangement",
    descriptionEn: "American hand tool and storage manufacturer",
    characteristicIds: ["CAR001"]
  },
  {
    id: "VAL005",
    type: "Valeur",
    nameFr: "Stihl",
    nameEn: "Stihl",
    descriptionFr: "Fabricant allemand de tronçonneuses et équipements d'extérieur",
    descriptionEn: "German chainsaw and outdoor power equipment manufacturer",
    characteristicIds: ["CAR001"]
  },
  // Valeurs pour Couleur (CAR002) - ATTENTION: "Blanc" est aussi utilisé pour Finition (CAR010)
  {
    id: "VAL006",
    type: "Valeur",
    nameFr: "Blanc",
    nameEn: "White",
    descriptionFr: "Couleur blanche standard",
    descriptionEn: "Standard white color",
    characteristicIds: ["CAR002", "CAR010"] // SHARED: Used for both Color and Finish
  },
  {
    id: "VAL007",
    type: "Valeur",
    nameFr: "Noir",
    nameEn: "Black",
    descriptionFr: "Couleur noire standard",
    descriptionEn: "Standard black color",
    characteristicIds: ["CAR002", "CAR010"] // SHARED: Used for both Color and Finish
  },
  {
    id: "VAL008",
    type: "Valeur",
    nameFr: "Gris anthracite",
    nameEn: "Anthracite Gray",
    descriptionFr: "",
    descriptionEn: "Dark gray color similar to charcoal",
    characteristicIds: ["CAR002"]
  },
  {
    id: "VAL009",
    type: "Valeur",
    nameFr: "Beige",
    nameEn: "Beige",
    descriptionFr: "Ton beige neutre",
    descriptionEn: "Neutral beige tone",
    characteristicIds: ["CAR002"]
  },
  // Valeurs pour Puissance (CAR003)
  {
    id: "VAL010",
    type: "Valeur",
    nameFr: "500W",
    nameEn: "500W",
    descriptionFr: "Puissance de 500 watts",
    descriptionEn: "500 watts power output",
    characteristicIds: ["CAR003"]
  },
  {
    id: "VAL011",
    type: "Valeur",
    nameFr: "750W",
    nameEn: "750W",
    descriptionFr: "Puissance de 750 watts pour applications moyennes",
    descriptionEn: "750 watts power output for medium-duty applications",
    characteristicIds: ["CAR003"]
  },
  {
    id: "VAL012",
    type: "Valeur",
    nameFr: "1000W",
    nameEn: "1000W",
    descriptionFr: "Puissance de 1000 watts pour applications intensives",
    descriptionEn: "1000 watts power output for heavy-duty applications",
    characteristicIds: ["CAR003"]
  },
  {
    id: "VAL013",
    type: "Valeur",
    nameFr: "1500W",
    nameEn: "1500W",
    descriptionFr: "Puissance de 1500 watts pour usage professionnel",
    descriptionEn: "1500 watts power output for professional use",
    characteristicIds: ["CAR003"]
  },
  // Valeurs pour Capacite (CAR004)
  {
    id: "VAL014",
    type: "Valeur",
    nameFr: "130L",
    nameEn: "130L",
    descriptionFr: "Capacité de 130 litres",
    descriptionEn: "130 liter capacity",
    characteristicIds: ["CAR004"]
  },
  {
    id: "VAL015",
    type: "Valeur",
    nameFr: "180L",
    nameEn: "180L",
    descriptionFr: "Capacité de 180 litres pour grands projets",
    descriptionEn: "180 liter capacity for larger projects",
    characteristicIds: ["CAR004"]
  },
  {
    id: "VAL016",
    type: "Valeur",
    nameFr: "250L",
    nameEn: "250L",
    descriptionFr: "Capacité de 250 litres pour usage professionnel",
    descriptionEn: "250 liter capacity for professional use",
    characteristicIds: ["CAR004"]
  },
  // Valeurs pour Materiau (CAR005) - ATTENTION: Certains matériaux sont aussi des finitions
  {
    id: "VAL017",
    type: "Valeur",
    nameFr: "Acier",
    nameEn: "Steel",
    descriptionFr: "Acier standard",
    descriptionEn: "Standard steel material",
    characteristicIds: ["CAR005", "CAR010"] // SHARED: Material AND Finish (brushed steel, polished steel, etc.)
  },
  {
    id: "VAL018",
    type: "Valeur",
    nameFr: "",
    nameEn: "Aluminum",
    descriptionFr: "",
    descriptionEn: "Lightweight aluminum alloy",
    characteristicIds: ["CAR005"]
  },
  {
    id: "VAL019",
    type: "Valeur",
    nameFr: "Fibre de verre",
    nameEn: "Fiberglass",
    descriptionFr: "",
    descriptionEn: "Reinforced fiberglass composite",
    characteristicIds: ["CAR005"]
  },
  {
    id: "VAL020",
    type: "Valeur",
    nameFr: "",
    nameEn: "Chrome Vanadium",
    descriptionFr: "",
    descriptionEn: "High-strength chrome vanadium steel alloy",
    characteristicIds: ["CAR005"]
  },
  // Valeurs pour Pays de fabrication (CAR006)
  {
    id: "VAL021",
    type: "Valeur",
    nameFr: "France",
    nameEn: "France",
    descriptionFr: "Fabriqué en France",
    descriptionEn: "Made in France",
    characteristicIds: ["CAR006"]
  },
  {
    id: "VAL022",
    type: "Valeur",
    nameFr: "Allemagne",
    nameEn: "Germany",
    descriptionFr: "",
    descriptionEn: "Made in Germany - known for precision engineering",
    characteristicIds: ["CAR006"]
  },
  {
    id: "VAL023",
    type: "Valeur",
    nameFr: "",
    nameEn: "China",
    descriptionFr: "",
    descriptionEn: "Made in China",
    characteristicIds: ["CAR006"]
  },
  {
    id: "VAL024",
    type: "Valeur",
    nameFr: "Japon",
    nameEn: "Japan",
    descriptionFr: "",
    descriptionEn: "Made in Japan - known for quality manufacturing",
    characteristicIds: ["CAR006"]
  },
  // Valeurs pour Taille (CAR008)
  {
    id: "VAL025",
    type: "Valeur",
    nameFr: "Petit",
    nameEn: "Small",
    descriptionFr: "Taille compacte",
    descriptionEn: "Compact size for light use",
    characteristicIds: ["CAR008"]
  },
  {
    id: "VAL026",
    type: "Valeur",
    nameFr: "",
    nameEn: "Medium",
    descriptionFr: "",
    descriptionEn: "Standard medium size",
    characteristicIds: ["CAR008"]
  },
  {
    id: "VAL027",
    type: "Valeur",
    nameFr: "Grand",
    nameEn: "Large",
    descriptionFr: "",
    descriptionEn: "Large size for heavy-duty applications",
    characteristicIds: ["CAR008"]
  },
  {
    id: "VAL028",
    type: "Valeur",
    nameFr: "",
    nameEn: "15m",
    descriptionFr: "",
    descriptionEn: "15 meter length",
    characteristicIds: ["CAR008"]
  },
  {
    id: "VAL029",
    type: "Valeur",
    nameFr: "25m",
    nameEn: "25m",
    descriptionFr: "Longueur de 25 metres",
    descriptionEn: "25 meter length",
    characteristicIds: ["CAR008"]
  },
  // Valeurs pour Voltage (CAR009)
  {
    id: "VAL030",
    type: "Valeur",
    nameFr: "230V",
    nameEn: "230V",
    descriptionFr: "Tension standard europeenne",
    descriptionEn: "Standard European voltage",
    characteristicIds: ["CAR009"]
  },
  {
    id: "VAL031",
    type: "Valeur",
    nameFr: "",
    nameEn: "400V",
    descriptionFr: "",
    descriptionEn: "Three-phase industrial voltage",
    characteristicIds: ["CAR009"]
  },
  {
    id: "VAL032",
    type: "Valeur",
    nameFr: "1000V",
    nameEn: "1000V",
    descriptionFr: "",
    descriptionEn: "High voltage rated for electrical work",
    characteristicIds: ["CAR009"]
  },
  // Valeurs pour Finition (CAR010)
  {
    id: "VAL033",
    type: "Valeur",
    nameFr: "Mat",
    nameEn: "Matte",
    descriptionFr: "Finition mate sans reflet",
    descriptionEn: "Non-reflective matte finish",
    characteristicIds: ["CAR010"]
  },
  {
    id: "VAL034",
    type: "Valeur",
    nameFr: "",
    nameEn: "Satin",
    descriptionFr: "",
    descriptionEn: "Soft sheen satin finish",
    characteristicIds: ["CAR010"]
  },
  {
    id: "VAL035",
    type: "Valeur",
    nameFr: "Brillant",
    nameEn: "Gloss",
    descriptionFr: "",
    descriptionEn: "High-shine glossy finish",
    characteristicIds: ["CAR010"]
  },
  {
    id: "VAL036",
    type: "Valeur",
    nameFr: "",
    nameEn: "Brushed",
    descriptionFr: "",
    descriptionEn: "Brushed metal texture finish",
    characteristicIds: ["CAR010"]
  },
  // Valeurs pour Poids (CAR012)
  {
    id: "VAL037",
    type: "Valeur",
    nameFr: "Leger (<5kg)",
    nameEn: "Light (<5kg)",
    descriptionFr: "Produit leger pour manipulation facile",
    descriptionEn: "Lightweight product for easy handling",
    characteristicIds: ["CAR012"]
  },
  {
    id: "VAL038",
    type: "Valeur",
    nameFr: "",
    nameEn: "Medium (5-15kg)",
    descriptionFr: "",
    descriptionEn: "Medium weight suitable for regular use",
    characteristicIds: ["CAR012"]
  },
  {
    id: "VAL039",
    type: "Valeur",
    nameFr: "Lourd (>15kg)",
    nameEn: "Heavy (>15kg)",
    descriptionFr: "",
    descriptionEn: "Heavy-duty product requiring two-person handling",
    characteristicIds: ["CAR012"]
  },
]

// Helper functions to get all characteristics and values
export function getAllCharacteristics(): Characteristic[] {
  return characteristicsDatabase
}

export function getAllValues(): CharacteristicValue[] {
  return valuesDatabase
}

// Get the number of models that use a specific value
export function getModelCountForValue(valueId: string): number {
  const value = valuesDatabase.find(v => v.id === valueId)
  if (!value) return 0
  
  // Get all characteristics that use this value
  const relatedCharacteristics = characteristicsDatabase.filter(c => 
    value.characteristicIds.includes(c.id)
  )
  
  // Collect all unique model IDs from these characteristics
  const uniqueModelIds = new Set<string>()
  relatedCharacteristics.forEach(char => {
    char.modelIds.forEach(modelId => uniqueModelIds.add(modelId))
  })
  
  return uniqueModelIds.size
}

// Build hierarchical tree for filters
export function buildCategoryTree(): CategoryNode[] {
  const rayons = productDatabase.filter((p) => p.type === "Rayon")

  function buildNode(item: ProductItem): CategoryNode {
    const children = productDatabase.filter((p) => p.parentId === item.id)
    const categoryChildren: CategoryNode[] = children.map(buildNode)
    
    // If this is a Modèle, add its characteristics and values as children
    if (item.type === "Modèle") {
      const characteristics = getCharacteristicsForModel(item.id)
      
      characteristics.forEach(char => {
        const charNode: CategoryNode = {
          id: char.id,
          nameFr: char.nameFr,
          level: "Caractéristique",
          children: [],
          count: char.modelIds.length > 1 ? char.modelIds.length : undefined
        }
        
        // Only add values for closed characteristics
        if (char.characteristicType === "fermé") {
          const values = getValuesForCharacteristic(char.id)
          charNode.children = values.map(val => {
            const modelCount = getModelCountForValue(val.id)
            return {
              id: val.id,
              nameFr: val.nameFr,
              level: "Valeur",
              children: [],
              count: modelCount > 1 ? modelCount : undefined
            }
          })
        }
        
        categoryChildren.push(charNode)
      })
    }
    
    return {
      id: item.id,
      nameFr: item.nameFr,
      level: item.type,
      children: categoryChildren,
    }
  }

  return rayons.map(buildNode)
}

// Get all unique values by level
export function getItemsByLevel(level: ProductLevel): ProductItem[] {
  return productDatabase.filter((p) => p.type === level)
}

// Get unified list of all items (products + characteristics + values)
export function getAllUnifiedItems(): UnifiedItem[] {
  const products: UnifiedItem[] = productDatabase.map(p => ({
    id: p.id,
    type: p.type,
    nameFr: p.nameFr,
    nameEn: p.nameEn,
    descriptionFr: p.descriptionFr,
    descriptionEn: p.descriptionEn,
  }))
  
  const characteristics: UnifiedItem[] = characteristicsDatabase.map(c => ({
    id: c.id,
    type: c.type,
    nameFr: c.nameFr,
    nameEn: c.nameEn,
    descriptionFr: c.descriptionFr,
    descriptionEn: c.descriptionEn,
    characteristicType: c.characteristicType,
    linkedIds: c.modelIds,
  }))
  
  const values: UnifiedItem[] = valuesDatabase.map(v => ({
    id: v.id,
    type: v.type,
    nameFr: v.nameFr,
    nameEn: v.nameEn,
    descriptionFr: v.descriptionFr,
    descriptionEn: v.descriptionEn,
    linkedIds: v.characteristicIds,
  }))
  
  return [...products, ...characteristics, ...values]
}

// Get values linked to a specific characteristic
export function getValuesForCharacteristic(characteristicId: string): CharacteristicValue[] {
  return valuesDatabase.filter(v => v.characteristicIds.includes(characteristicId))
}

// Get characteristics linked to a specific model
export function getCharacteristicsForModel(modelId: string): Characteristic[] {
  return characteristicsDatabase.filter(c => c.modelIds.includes(modelId))
}

// Get models linked to a specific characteristic
export function getModelsForCharacteristic(characteristicId: string): ProductItem[] {
  const characteristic = characteristicsDatabase.find(c => c.id === characteristicId)
  if (!characteristic) return []
  return productDatabase.filter(p => characteristic.modelIds.includes(p.id))
}

// Value-first view: Get all values with their linked characteristics and models
export interface ValueFirstView {
  value: CharacteristicValue
  characteristics: Characteristic[]
  models: ProductItem[]
}

export function getValueFirstView(): ValueFirstView[] {
  return valuesDatabase.map(value => {
    const characteristics = characteristicsDatabase.filter(c => 
      value.characteristicIds.includes(c.id)
    )
    const modelIds = new Set<string>()
    characteristics.forEach(c => {
      c.modelIds.forEach(id => modelIds.add(id))
    })
    const models = productDatabase.filter(p => modelIds.has(p.id))
    
    return { value, characteristics, models }
  })
}
