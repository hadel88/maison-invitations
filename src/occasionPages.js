// The guest page speaks the language of its occasion: headings, RSVP wording and ornaments
// change with the celebration, so a corporate gala never reads like a wedding.

export const occasionSlug = (occasion) => ({
  Wedding: 'wedding', Birthday: 'birthday', Engagement: 'engagement', 'Baby shower': 'baby',
  Graduation: 'graduation', 'Dinner party': 'dinner', Anniversary: 'anniversary',
  'Corporate event': 'corporate', Christening: 'christening', 'Seasonal celebration': 'seasonal',
  'Marriage proposal': 'proposal', 'Workshops & seminars': 'workshop',
  'Store & business opening': 'opening', 'New Year’s Eve': 'newyear',
}[occasion] || 'wedding');

// [phase line, details heading, rsvp eyebrow, rsvp heading, yes, no]
const voices = {
  wedding: {
    en: ['The lovely anticipation begins.', 'A day to remember.', 'WE SAVED YOU A PLACE', 'Kindly RSVP', 'Joyfully accepts', 'Regretfully declines'],
    de: ['Die Vorfreude beginnt.', 'Ein Tag zum Erinnern.', 'WIR HABEN DIR EINEN PLATZ FREIGEHALTEN', 'Bitte gib uns Bescheid', 'Mit Freude dabei', 'Leider verhindert'],
    fr: ['Le bonheur de se retrouver approche.', 'Une journée inoubliable.', 'NOUS VOUS AVONS GARDÉ UNE PLACE', 'Merci de répondre', 'Avec joie', 'À regret, non'],
  },
  birthday: {
    en: ['The countdown to the party has begun.', 'Party details', 'THERE IS CAKE WITH YOUR NAME ON IT', 'Are you coming?', 'Count me in!', 'I’ll miss it'],
    de: ['Der Countdown zur Party läuft.', 'Alles zur Party', 'EIN STÜCK KUCHEN WARTET AUF DICH', 'Bist du dabei?', 'Ich bin dabei!', 'Ich kann leider nicht'],
    fr: ['Le compte à rebours de la fête a commencé.', 'Le programme de la fête', 'UNE PART DE GÂTEAU VOUS ATTEND', 'Vous venez ?', 'Je serai là !', 'Je vais le manquer'],
  },
  engagement: {
    en: ['We said yes, and we want you there.', 'Celebrate with us', 'A TOAST TO FOREVER', 'Will you join us?', 'Wouldn’t miss it', 'Celebrating from afar'],
    de: ['Wir haben Ja gesagt, und du gehörst dazu.', 'Feiere mit uns', 'AUF DIE EWIGKEIT', 'Feierst du mit?', 'Auf keinen Fall verpassen', 'Ich feiere aus der Ferne'],
    fr: ['Nous avons dit oui, et nous vous voulons à nos côtés.', 'Célébrez avec nous', 'UN TOAST À L’ÉTERNITÉ', 'Serez-vous des nôtres ?', 'Je ne manquerai pas ça', 'Je fête de loin'],
  },
  baby: {
    en: ['A little wonder is on the way.', 'The little details', 'SHOWER US WITH LOVE', 'Will you be there?', 'Happily, yes', 'Sending love instead'],
    de: ['Ein kleines Wunder ist unterwegs.', 'Die kleinen Details', 'SCHENK UNS EIN BISSCHEN LIEBE', 'Bist du dabei?', 'Sehr gern', 'Ich schicke liebe Grüße'],
    fr: ['Une petite merveille est en route.', 'Les petits détails', 'COMBLEZ-NOUS DE DOUCEUR', 'Serez-vous là ?', 'Avec plaisir', 'J’envoie toute ma tendresse'],
  },
  graduation: {
    en: ['Caps off to a new chapter.', 'The celebration', 'CELEBRATE THE GRADUATE', 'Will you be there?', 'I’ll be cheering', 'Proud from afar'],
    de: ['Hüte ab für ein neues Kapitel.', 'Die Feier', 'FEIERE DEN ABSCHLUSS MIT', 'Bist du dabei?', 'Ich jubel mit', 'Stolz aus der Ferne'],
    fr: ['Chapeau pour ce nouveau chapitre.', 'La célébration', 'FÊTONS LE DIPLÔMÉ', 'Serez-vous là ?', 'Je serai là pour applaudir', 'Fier de loin'],
  },
  dinner: {
    en: ['A seat at our table is waiting for you.', 'The evening', 'A CHAIR WITH YOUR NAME', 'Will you dine with us?', 'Save me a seat', 'Next time, I promise'],
    de: ['Ein Platz an unserem Tisch wartet auf dich.', 'Der Abend', 'EIN STUHL MIT DEINEM NAMEN', 'Isst du mit uns?', 'Halt mir einen Platz frei', 'Nächstes Mal, versprochen'],
    fr: ['Une place à notre table vous attend.', 'La soirée', 'UNE CHAISE À VOTRE NOM', 'Dînerez-vous avec nous ?', 'Gardez-moi une place', 'La prochaine fois, promis'],
  },
  anniversary: {
    en: ['Years of love, and still counting.', 'Our celebration', 'RAISE A GLASS WITH US', 'Will you toast with us?', 'Joyfully, yes', 'Toasting from afar'],
    de: ['Jahre voller Liebe, und es geht weiter.', 'Unsere Feier', 'STOSS MIT UNS AN', 'Stößt du mit uns an?', 'Mit Freude, ja', 'Ich stoße aus der Ferne an'],
    fr: ['Des années d’amour, et ce n’est qu’un début.', 'Notre célébration', 'LEVEZ VOTRE VERRE AVEC NOUS', 'Trinquerez-vous avec nous ?', 'Avec joie, oui', 'Je trinque de loin'],
  },
  corporate: {
    en: ['We look forward to welcoming you.', 'Event information', 'YOUR INVITATION', 'Confirm your attendance', 'I will attend', 'I am unable to attend'],
    de: ['Wir freuen uns, Sie begrüßen zu dürfen.', 'Veranstaltungsinformationen', 'IHRE EINLADUNG', 'Teilnahme bestätigen', 'Ich nehme teil', 'Ich kann nicht teilnehmen'],
    fr: ['Nous serons ravis de vous accueillir.', 'Informations pratiques', 'VOTRE INVITATION', 'Confirmez votre présence', 'Je serai présent·e', 'Je ne pourrai pas venir'],
  },
  christening: {
    en: ['A small blessing, a lifetime of love.', 'The blessing', 'BE PART OF THIS BLESSING', 'Will you join us?', 'With love, yes', 'In our thoughts'],
    de: ['Ein kleiner Segen, ein Leben voller Liebe.', 'Die Taufe', 'SEI TEIL DIESES SEGENS', 'Bist du dabei?', 'Von Herzen, ja', 'In Gedanken dabei'],
    fr: ['Une petite bénédiction, une vie d’amour.', 'La bénédiction', 'PRENEZ PART À CETTE BÉNÉDICTION', 'Serez-vous des nôtres ?', 'Avec amour, oui', 'Par la pensée'],
  },
  seasonal: {
    en: ['The most wonderful time is almost here.', 'The festivities', 'A PLACE BY THE FIRE', 'Will you celebrate with us?', 'Merrily, yes', 'Sending warm wishes'],
    de: ['Die schönste Zeit ist fast da.', 'Das Fest', 'EIN PLATZ AM KAMIN', 'Feierst du mit uns?', 'Fröhlich, ja', 'Ich sende herzliche Grüße'],
    fr: ['La plus belle période approche.', 'Les festivités', 'UNE PLACE PRÈS DU FEU', 'Fêterez-vous avec nous ?', 'Joyeusement, oui', 'Avec mes meilleurs vœux'],
  },
  proposal: {
    en: ['I have a little surprise planned.', 'Where it happens', 'JUST BETWEEN US', 'Will you marry me?', 'A thousand times yes', 'Let’s talk'],
    de: ['Ich habe eine kleine Überraschung geplant.', 'Wo es passiert', 'NUR ZWISCHEN UNS', 'Willst du mich heiraten?', 'Tausendmal ja', 'Lass uns reden'],
    fr: ['J’ai préparé une petite surprise.', 'Là où tout se passe', 'RIEN QU’ENTRE NOUS', 'Veux-tu m’épouser ?', 'Mille fois oui', 'Parlons-en'],
  },
  workshop: {
    en: ['Ideas grow best together.', 'Session details', 'YOUR PLACE AT THE ATELIER', 'Reserve your place', 'I’ll be there', 'Unable to attend'],
    de: ['Ideen wachsen am besten gemeinsam.', 'Zur Veranstaltung', 'DEIN PLATZ IM ATELIER', 'Platz reservieren', 'Ich bin dabei', 'Ich kann nicht teilnehmen'],
    fr: ['Les idées grandissent mieux ensemble.', 'Le programme de la session', 'VOTRE PLACE À L’ATELIER', 'Réservez votre place', 'Je serai là', 'Je ne pourrai pas venir'],
  },
  opening: {
    en: ['The doors are about to open.', 'Opening day', 'BE AMONG THE FIRST', 'Join the opening', 'I’ll be there', 'Next time'],
    de: ['Gleich öffnen sich die Türen.', 'Eröffnungstag', 'SEI UNTER DEN ERSTEN', 'Zur Eröffnung kommen', 'Ich komme', 'Beim nächsten Mal'],
    fr: ['Les portes vont bientôt s’ouvrir.', 'Le jour de l’ouverture', 'SOYEZ PARMI LES PREMIERS', 'Venez à l’inauguration', 'Je serai là', 'Une prochaine fois'],
  },
  newyear: {
    en: ['The countdown to midnight has begun.', 'The night', 'A GLASS IS WAITING FOR YOU', 'Ring in the new year with us?', 'See you at midnight', 'Cheers from afar'],
    de: ['Der Countdown bis Mitternacht läuft.', 'Die Nacht', 'EIN GLAS WARTET AUF DICH', 'Rutschst du mit uns rein?', 'Wir sehen uns um Mitternacht', 'Prost aus der Ferne'],
    fr: ['Le compte à rebours vers minuit a commencé.', 'La nuit', 'UNE COUPE VOUS ATTEND', 'Fêterez-vous minuit avec nous ?', 'Rendez-vous à minuit', 'Santé de loin'],
  },
};

export function pageVoice(occasion, lang = 'en') {
  const v = voices[occasionSlug(occasion)];
  const [phase, details, eyebrow, rsvp, yes, no] = v[lang] || v.en;
  return { phase, details, eyebrow, rsvp, yes, no };
}
