"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SearchX, PenLine, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    icon: SearchX,
    title: "Voir les traductions manquantes",
    description: "Identifiez et traduisez automatiquement les elements sans traduction francaise (noms et descriptions) via DeepL.",
    href: "/translation/missing",
    accentClass: "text-amber-600 bg-amber-50 border-amber-200",
    iconBgClass: "bg-amber-100 text-amber-600",
  },
  {
    icon: PenLine,
    title: "Corriger une traduction",
    description: "Recherchez et modifiez manuellement une traduction existante pour corriger une erreur ou ameliorer la formulation.",
    href: "/translation/correct",
    accentClass: "text-primary bg-primary/5 border-primary/20",
    iconBgClass: "bg-primary/10 text-primary",
  },
  {
    icon: CheckCircle2,
    title: "Valider une traduction",
    description: "Passez en revue les traductions en attente et validez-les pour les rendre officielles dans le systeme.",
    href: "/translation/validate",
    accentClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
    iconBgClass: "bg-emerald-100 text-emerald-600",
  },
]

export default function TranslationMenu() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="MIM Translate SandBox" />
        <main className="flex-1 overflow-auto px-8 py-10 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Gestion des traductions</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Selectionnez une action pour gerer les traductions de votre catalogue produit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group flex flex-col rounded-xl border-2 bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${action.accentClass}`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${action.iconBgClass}`}>
                    <action.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-foreground text-base mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{action.description}</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium mt-5 opacity-0 group-hover:opacity-100 transition-opacity text-foreground">
                    Acceder
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
