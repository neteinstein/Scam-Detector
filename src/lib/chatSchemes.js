/*
 * Chat monitor for classified / second-hand marketplaces (OLX, Vinted,
 * Wallapop, Leboncoin, Facebook Marketplace, ...). Recognises the standard
 * scripts scammers use in buyer/seller conversations, in English,
 * Portuguese, Spanish and French.
 *
 * Patterns are matched against accent-stripped lower-case text (see
 * phrases.normalize), so they are written without accents.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./domain.js'), require('./phrases.js'), require('./lookalike.js'));
  else { root.SD = root.SD || {}; root.SD.chatSchemes = factory(root.SD.domain, root.SD.phrases, root.SD.lookalike); }
})(typeof self !== 'undefined' ? self : this, function (domain, phrases, lookalike) {
  // Registrable domains of marketplaces where the chat monitor is active.
  const MARKETPLACES = [
    'olx.pt', 'olx.com', 'olx.pl', 'olx.ro', 'olx.ua', 'olx.bg', 'olx.com.br', 'olx.in', 'olx.co.za', 'olx.kz', 'olx.uz', 'olx.ba',
    'custojusto.pt', 'standvirtual.com', 'imovirtual.com', 'vinted.com', 'vinted.pt', 'vinted.fr', 'vinted.es', 'vinted.it', 'vinted.de',
    'vinted.co.uk', 'vinted.nl', 'vinted.be', 'vinted.pl', 'vinted.lt', 'vinted.cz', 'vinted.sk', 'vinted.at', 'vinted.lu', 'vinted.se',
    'wallapop.com', 'milanuncios.com', 'leboncoin.fr', 'marktplaats.nl', '2dehands.be', '2ememain.be', 'kleinanzeigen.de', 'ebay.com',
    'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.es', 'ebay.it', 'ebay.ca', 'ebay.com.au', 'subito.it', 'gumtree.com', 'gumtree.com.au',
    'craigslist.org', 'facebook.com', 'messenger.com', 'depop.com', 'etsy.com', 'mercadolibre.com', 'mercadolibre.com.ar',
    'mercadolibre.com.mx', 'mercadolivre.com.br', 'enjoei.com.br', 'idealista.com', 'idealista.pt', 'idealista.it', 'fotocasa.es',
    'coches.net', 'autoscout24.com', 'autoscout24.pt', 'autoscout24.es', 'autoscout24.fr', 'autoscout24.de', 'autoscout24.it',
    'mobile.de', 'willhaben.at', 'tutti.ch', 'anibis.ch', 'ricardo.ch', 'finn.no', 'blocket.se', 'dba.dk', 'tori.fi', 'bazos.cz',
    'bazos.sk', 'sahibinden.com', 'avito.ru', 'segundamano.mx', 'shpock.com', 'vivastreet.com', 'paruvendu.fr', 'seloger.com',
    'pap.fr', 'rightmove.co.uk', 'zoopla.co.uk', 'spareroom.co.uk', 'daft.ie', 'donedeal.ie', 'adverts.ie', 'kijiji.ca', 'trademe.co.nz',
    'offerup.com', 'mercari.com', 'poshmark.com', 'reverb.com', 'discogs.com', 'cardmarket.com', 'catawiki.com', 'troc.com',
  ];

  // Each scheme: id, title, advice, weight, strong (counts even outside a recognised chat area), patterns by language.
  const SCHEMES = [
    {
      id: 'courier-pickup', weight: 20, strong: true,
      title: 'Buyer wants to send a courier and pay remotely',
      advice: 'Classic OLX/Vinted scam: the "courier" or "delivery service" is fake and the payment link steals your card details. Only use the platform\'s own delivery and payment flow.',
      en: [
        /\b(i('ll| will)|i can|let me|my) (send|sending|arrange)? ?(a |the |my )?(courier|driver|delivery (service|company|guy|agent)|transport(er|ation)? company|dhl|ups|fedex) (to |will )?(pick|collect|come|take)/,
        /\b(courier|delivery (service|company)|transport(er)?|driver) (will|can|is going to) (come|pick|collect|pay|bring)/,
        /\b(pay|payment) (through|via|by|with) (the )?(courier|delivery (service|company)|transport company|dhl|ups|fedex)\b/,
        /\b(i|we) (already )?(paid|pay|have paid) (for )?(the )?(shipping|delivery|courier)\b.{0,60}\b(link|receive|confirm|card)\b/,
      ],
      pt: [
        /\b(envio|mando|posso enviar|vou enviar|vou mandar) (um |uma |a |o )?(estafeta|motorista|transportador|transportadora|empresa de (transporte|entregas?)|servico de entrega|dhl|ups|fedex|ctt)\b.{0,40}\b(buscar|levantar|recolher|apanhar|ir ai|ir buscar)\b/,
        /\b(estafeta|transportadora|transportador|servico de entrega|empresa de entregas?|motorista) (vai|ira|pode|vem) (buscar|levantar|recolher|pagar|entregar|ai)\b/,
        /\b(pago|pagamento|pagar) (atraves|por via|por meio|pela|pelo|via|com) (d[ao] )?(estafeta|transportadora|servico de entrega|empresa de entregas?|dhl|ups|fedex|ctt)\b/,
        /\b(ja )?(paguei|pago|efetuei o pagamento) (d[oa] |pel[oa] )?(envio|entrega|transporte|portes)\b.{0,60}\b(link|ligacao|receber|confirmar|cartao)\b/,
      ],
      es: [
        /\b(envio|mando|puedo enviar|voy a enviar|voy a mandar) (un |una |el |la |a )?(mensajero|repartidor|transportista|empresa de (transporte|mensajeria|envios?)|servicio de (entrega|mensajeria)|dhl|ups|fedex|seur|correos)\b.{0,40}\b(recoger|recogerlo|buscar|pasar|a por)\b/,
        /\b(mensajero|repartidor|transportista|servicio de (entrega|mensajeria)|empresa de (transporte|mensajeria)) (va a|ira a|puede|vendra a|viene a) (recoger|buscar|pagar|entregar|pasar)\b/,
        /\b(pago|pagar|el pago) (a traves|por medio|mediante|via|con|por) (d?el |la )?(mensajero|repartidor|transportista|servicio de (entrega|mensajeria)|empresa de (transporte|mensajeria)|dhl|ups|fedex|seur|correos)\b/,
        /\b(ya )?(pague|he pagado|realice el pago|hice el pago) (d?el |por el )?(envio|entrega|transporte|mensajero)\b.{0,60}\b(enlace|link|recibir|confirmar|tarjeta)\b/,
      ],
      fr: [
        /\b(j'envoie|je vais envoyer|je peux envoyer|j'enverrai|je fais passer|je mandate) (un |une |mon |le |la )?(coursier|livreur|transporteur|chauffeur|societe de (transport|livraison)|service de livraison|dhl|ups|fedex|chronopost|mondial relay)\b.{0,40}\b(recuperer|chercher|prendre|enlever|passer|venir)\b/,
        /\b(coursier|livreur|transporteur|chauffeur|service de livraison|societe de (transport|livraison)) (va|viendra|peut|passera|vient) (recuperer|chercher|prendre|payer|livrer|passer)\b/,
        /\b(paiement|payer|paye|reglement) (par|via|avec|aupres d[eu]|a travers) (le |la |l')?(coursier|livreur|transporteur|service de livraison|societe de (transport|livraison)|dhl|ups|fedex|chronopost|mondial relay)\b/,
        /\b(j'ai )?(deja )?(paye|regle|effectue le paiement) (de |pour )?(la livraison|l'expedition|le transport|les frais de port|le coursier)\b.{0,60}\b(lien|recevoir|confirmer|carte)\b/,
      ],
    },
    {
      id: 'payment-link', weight: 25, strong: true,
      title: 'Asked to open a link or enter card details to "receive" money',
      advice: 'Nobody needs your card number, CVV or a link to pay you. Real platform payouts go to the account you already set up. Do not open the link.',
      en: [
        /\b(click|open|follow|use|go to) (on |the |this |my )*(link|url|page)\b.{0,60}\b(receive|get|collect|accept|confirm|withdraw) (the |your )?(payment|money|funds|transfer|amount)\b/,
        /\b(receive|get|collect|accept|withdraw) (the |your )?(payment|money|funds|transfer|amount)\b.{0,60}\b(link|url|page|form)\b/,
        /\b(enter|fill( in)?|provide|type|put|input|confirm) (your |the )?(card|credit card|debit card|bank card) (details|number|info|information|data)\b.{0,60}\b(receive|get|payment|money|funds|transfer|refund)\b/,
        /\b(card|credit card|debit card) (details|number|info|data)\b.{0,40}\b(to receive|so (that )?(i|we) can (pay|send|transfer))\b/,
        /\b(i|we) (have |already )?(sent|made|transferred) (the |a )?(payment|money|transfer)\b.{0,60}\b(click|open|link|confirm|accept)\b/,
        /\b(payment|money|funds) (is|are) (waiting|ready|pending)\b.{0,40}\b(link|confirm|accept|click)\b/,
      ],
      pt: [
        /\b(clique|clica|abre|abra|aceda|acede|entra|entre|usa|use|segue|siga) (no |neste |nesta |o |este |a |esta |em |meu |minha )*(link|ligacao|pagina|url)\b.{0,60}\b(receber|recebe|levantar|confirmar|aceitar|sacar) (o |a |os )?(pagamento|dinheiro|valor|fundos|transferencia|montante)\b/,
        /\b(receber|recebe|levantar|aceitar|sacar|confirmar) (o |a |os )?(pagamento|dinheiro|valor|fundos|transferencia|montante)\b.{0,60}\b(link|ligacao|pagina|formulario)\b/,
        /\b(insere|insira|introduz|introduza|coloca|coloque|preenche|preencha|indica|indique|confirma|confirme) (os |o )?(dados|numero) (do |de )?(cartao|cartao de credito|cartao de debito|cartao bancario|multibanco)\b.{0,60}\b(receber|pagamento|dinheiro|valor|transferencia|reembolso)\b/,
        /\b(dados|numero) do cartao\b.{0,40}\b(para receber|para (eu|nos) (poder )?(pagar|enviar|transferir))\b/,
        /\b(ja )?(fiz|efetuei|efectuei|enviei|realizei) (o |a )?(pagamento|transferencia)\b.{0,60}\b(clica|clique|abre|abra|link|confirma|confirme|aceita|aceite)\b/,
        /\b(pagamento|dinheiro|valor) (esta|fica) (a aguardar|pendente|pronto|disponivel)\b.{0,40}\b(link|confirma|confirme|aceita|aceite|clica|clique)\b/,
      ],
      es: [
        /\b(haz clic|haga clic|pincha|pinche|pulsa|pulse|abre|abra|entra|entre|accede|acceda|usa|use|sigue|siga) (en |a |el |este |la |esta |mi )*(enlace|link|pagina|url)\b.{0,60}\b(recibir|recibe|cobrar|cobra|retirar|confirmar|aceptar) (el |la |los |tu |su )?(pago|dinero|importe|fondos|transferencia|monto)\b/,
        /\b(recibir|recibe|cobrar|cobra|retirar|aceptar|confirmar) (el |la |los |tu |su )?(pago|dinero|importe|fondos|transferencia|monto)\b.{0,60}\b(enlace|link|pagina|formulario)\b/,
        /\b(introduce|introduzca|ingresa|ingrese|pon|ponga|rellena|rellene|indica|indique|confirma|confirme|escribe|escriba) (los |el )?(datos|numero) (de |de la |de tu |de su )?(tarjeta|tarjeta de credito|tarjeta de debito|tarjeta bancaria)\b.{0,60}\b(recibir|pago|dinero|importe|transferencia|reembolso)\b/,
        /\b(datos|numero) de (la |tu |su )?tarjeta\b.{0,40}\b(para recibir|para (que )?(yo |nosotros )?(pueda|podamos|poder) (pagar|enviar|transferir))\b/,
        /\b(ya )?(hice|he hecho|realice|he realizado|envie|he enviado|efectue) (el |la )?(pago|transferencia)\b.{0,60}\b(pincha|haz clic|abre|enlace|link|confirma|acepta)\b/,
        /\b(pago|dinero|importe) (esta|queda) (pendiente|en espera|listo|disponible)\b.{0,40}\b(enlace|link|confirma|acepta|pincha|haz clic)\b/,
      ],
      fr: [
        /\b(cliquez|clique|ouvrez|ouvre|suivez|suis|utilisez|utilise|allez|va|rendez-vous) (sur |ce |le |cette |la |mon |ma )*(lien|page|url)\b.{0,60}\b(recevoir|recois|recevez|recuperer|encaisser|accepter|confirmer|retirer) (le |la |les |votre |ton )?(paiement|argent|montant|fonds|virement|somme)\b/,
        /\b(recevoir|recois|recevez|recuperer|encaisser|accepter|confirmer|retirer) (le |la |les |votre |ton )?(paiement|argent|montant|fonds|virement|somme)\b.{0,60}\b(lien|page|formulaire|url)\b/,
        /\b(entrez|entre|saisissez|saisis|renseignez|renseigne|indiquez|indique|remplissez|remplis|mettez|mets|confirmez|confirme) (vos |les |tes |votre |ton )?(coordonnees|donnees|informations|numero|details) (de |de la |de votre |de ta )?(carte|carte bancaire|carte bleue|cb|carte de credit)\b.{0,60}\b(recevoir|paiement|argent|montant|virement|remboursement)\b/,
        /\b(numero|coordonnees|donnees) de (la |votre |ta )?(carte|cb)\b.{0,40}\b(pour recevoir|pour (que )?(je |nous )?(puisse|puissions|pouvoir) (payer|envoyer|virer))\b/,
        /\b(j'ai |nous avons )?(deja )?(effectue|fait|envoye|realise) (le |un |la )?(paiement|virement)\b.{0,60}\b(cliquez|clique|ouvrez|ouvre|lien|confirmez|confirme|acceptez|accepte)\b/,
        /\b(paiement|argent|montant) (est|reste) (en attente|pret|disponible)\b.{0,40}\b(lien|confirmez|confirme|acceptez|accepte|cliquez|clique)\b/,
      ],
    },
    {
      id: 'fee-to-release', weight: 18, strong: true,
      title: 'Payment "held" until you pay a fee or insurance',
      advice: 'Money that is "blocked until you pay insurance / transport / a verification fee" does not exist. The fee is the scam.',
      en: [
        /\b(pay|cover|send) (the |a |an )?(insurance|shipping|transport|delivery|customs|verification|activation|commission|tax|security) (fee|cost|deposit|charge)s?\b.{0,80}\b(first|before|to (release|unlock|receive|get|confirm))\b/,
        /\b(money|payment|funds|amount) (is|are|will be) (on hold|held|blocked|frozen|reserved|pending|in escrow)\b.{0,60}\b(until|unless|after|once)\b.{0,40}\b(pay|fee|insurance|confirm|verify)\b/,
        /\b(platform|company|service|system|bank|olx|vinted|wallapop|ebay) (holds|keeps|is holding|has) (the |your )?(money|payment|funds)\b.{0,60}\b(until|unless|pay|fee)\b/,
        /\b(refundable|refunded|reimbursed|returned)\b.{0,40}\b(fee|insurance|deposit)\b.{0,60}\b(after|once|when|upon) (delivery|receipt|confirmation|the (item|product) arrives)\b/,
      ],
      pt: [
        /\b(paga|pagar|pague|cobrir|cobre|envia|enviar|envie) (o |a |um |uma )?(seguro|portes|transporte|entrega|alfandega|verificacao|ativacao|activacao|comissao|imposto|seguranca|taxa|caucao)\b.{0,80}\b(primeiro|antes|para (libertar|liberar|desbloquear|receber|confirmar))\b/,
        /\b(dinheiro|pagamento|fundos|valor|montante) (esta|fica|ficam|estao|sera|vai ficar) (retid[oa]s?|bloquead[oa]s?|congelad[oa]s?|reservad[oa]s?|pendentes?|em custodia|cativ[oa]s?)\b.{0,60}\b(ate|enquanto|depois|assim que|apos)\b.{0,40}\b(pagar|pague|pagues|taxa|seguro|confirmar|verificar)\b/,
        /\b(plataforma|empresa|servico|sistema|banco|olx|vinted|wallapop|custojusto) (guarda|retem|tem|fica com|segura) (o |a |os )?(dinheiro|pagamento|fundos|valor)\b.{0,60}\b(ate|enquanto|pagar|taxa)\b/,
        /\b(reembolsavel|reembolsad[oa]|devolvid[oa]|restituid[oa])\b.{0,40}\b(taxa|seguro|caucao|valor)\b.{0,60}\b(apos|depois|assim que|quando|na) (a )?(entrega|recec?ao|confirmacao|chegada)\b/,
      ],
      es: [
        /\b(paga|pagar|pague|cubre|cubrir|envia|enviar|envie|abona|abonar) (el |la |un |una )?(seguro|envio|transporte|entrega|aduana|verificacion|activacion|comision|impuesto|seguridad|tasa|fianza)\b.{0,80}\b(primero|antes|para (liberar|desbloquear|recibir|confirmar|cobrar))\b/,
        /\b(dinero|pago|fondos|importe|monto) (esta|queda|quedan|estan|estara|se queda) (retenid[oa]s?|bloquead[oa]s?|congelad[oa]s?|reservad[oa]s?|pendientes?|en custodia|en deposito)\b.{0,60}\b(hasta|mientras|despues|en cuanto|tras|una vez)\b.{0,40}\b(pagar|pague|pagues|tasa|seguro|confirmar|verificar)\b/,
        /\b(plataforma|empresa|servicio|sistema|banco|olx|vinted|wallapop|milanuncios) (guarda|retiene|tiene|se queda con|custodia) (el |la |los )?(dinero|pago|fondos|importe)\b.{0,60}\b(hasta|mientras|pagar|tasa)\b/,
        /\b(reembolsable|reembolsad[oa]|devuelt[oa]|reintegrad[oa])\b.{0,40}\b(tasa|seguro|fianza|importe)\b.{0,60}\b(despues|tras|en cuanto|cuando|al) (de )?(la )?(entrega|recepcion|confirmacion|llegada)\b/,
      ],
      fr: [
        /\b(payez|payer|paye|reglez|regler|couvrez|couvrir|envoyez|envoyer|versez|verser) (les |l'|une |la |le |des )?(assurance|frais de port|frais de livraison|transport|livraison|douane|verification|activation|commission|taxe|securite|frais|caution)\b.{0,80}\b(d'abord|avant|pour (debloquer|liberer|recevoir|confirmer|encaisser))\b/,
        /\b(argent|paiement|fonds|montant|somme) (est|sont|reste|restent|sera|seront) (bloque|bloques|bloquee|retenu|retenus|retenue|gele|geles|reserve|reserves|en attente|sous sequestre|en securite)\b.{0,60}\b(jusqu'|tant que|apres|une fois|des que)\b.{0,40}\b(pay|frais|assurance|confirm|verif)/,
        /\b(plateforme|societe|service|systeme|banque|leboncoin|vinted|ebay) (garde|retient|conserve|detient|a) (l'|le |votre |les )?(argent|paiement|fonds|montant)\b.{0,60}\b(jusqu'|tant que|payer|frais)/,
        /\b(remboursable|rembourse|remboursee|restitue|restituee|rendu|rendue)\b.{0,40}\b(frais|assurance|caution|montant)\b.{0,60}\b(apres|une fois|des que|lors de|a la) (la )?(livraison|reception|confirmation|arrivee)\b/,
      ],
    },
    {
      id: 'sms-code', weight: 20, strong: true,
      title: 'Asked to forward a verification code',
      advice: 'The code is being used to take over an account (WhatsApp, Google Voice, the marketplace itself) in your name. Never share codes you receive by SMS.',
      en: [
        /\b(send|give|tell|forward|share|type) (me |us )?(the |that |this |your )?(verification |confirmation |security |6[- ]digit |4[- ]digit |sms |text )?code\b.{0,60}\b(received|got|sent you|sms|text|message|phone)\b/,
        /\b(i|we) (will |'ll |just |have )?(send|sent) (you )?(a |the )?(code|verification|text|sms)\b.{0,60}\b(send|tell|give|forward|reply|confirm)\b.{0,30}\b(code|number|it)\b/,
        /\b(google voice|whatsapp|telegram) (code|verification|pin)\b/,
        /\bcode (you|that) (received|got|will receive)\b/,
      ],
      pt: [
        /\b(envia|envie|manda|mande|diz|diga|passa|passe|partilha|partilhe|reencaminha|escreve)(-me)? (o |esse |este |aquele )?(codigo|pin)( de (verificacao|confirmacao|seguranca))?\b.{0,60}\b(recebeste|recebeu|chegou|sms|mensagem|telemovel|telefone)\b/,
        /\b(vou|vamos|acabei de|acabamos de) (te |lhe )?(enviar|mandar) (um |o )?(codigo|sms|mensagem)\b.{0,60}\b(envia|manda|diz|passa|responde|confirma)\b.{0,30}\b(codigo|numero)\b/,
        /\b(codigo|pin) (do |de |da )?(google voice|whatsapp|telegram)\b/,
        /\bcodigo que (recebeste|recebeu|te (chegou|enviaram)|vai receber|vais receber)\b/,
      ],
      es: [
        /\b(envia|envie|manda|mande|dime|digame|pasa|pase|comparte|comparta|reenvia|escribe)(me)? (el |ese |este |aquel |tu |su )?(codigo|pin)( de (verificacion|confirmacion|seguridad))?\b.{0,60}\b(recibiste|recibio|te llego|le llego|sms|mensaje|movil|celular|telefono)\b/,
        /\b(te |le )?(voy a|vamos a|acabo de|acabamos de) (enviar|mandar) (un |el )?(codigo|sms|mensaje)\b.{0,60}\b(envia|manda|dime|pasa|responde|confirma)\b.{0,30}\b(codigo|numero)\b/,
        /\b(codigo|pin) (de |del )?(google voice|whatsapp|telegram)\b/,
        /\bcodigo que (recibiste|recibio|te (llego|enviaron|mandaron)|le (llego|enviaron)|vas a recibir|recibiras)\b/,
      ],
      fr: [
        /\b(envoie|envoyez|donne|donnez|dis|dites|transmets|transmettez|partage|partagez|communique|communiquez|tape|tapez)(-moi|-nous)? (le |ce |votre |ton )?(code|pin)( de (verification|confirmation|securite))?\b.{0,60}\b(recu|recus|sms|message|texto|telephone|portable)\b/,
        /\b(je |nous )?(vais|allons|viens de|venons de|vous ai|t'ai) (vous |t')?(envoyer|envoye) (un |le )?(code|sms|texto|message)\b.{0,60}\b(envoie|envoyez|donne|donnez|dis|dites|transmets|reponds|repondez|confirme|confirmez)\b.{0,30}\b(code|numero)\b/,
        /\b(code|pin) (de |du )?(google voice|whatsapp|telegram)\b/,
        /\bcode que (vous avez|tu as) (recu|recus)\b/,
      ],
    },
    {
      id: 'overpayment', weight: 15, strong: true,
      title: 'Overpayment / refund-the-difference',
      advice: 'The original payment is fake or will be reversed; any "difference" you send back is lost.',
      en: phrases.CATEGORIES.overpayment.en, pt: phrases.CATEGORIES.overpayment.pt, es: phrases.CATEGORIES.overpayment.es, fr: phrases.CATEGORIES.overpayment.fr,
    },
    {
      id: 'abroad', weight: 10, strong: false,
      title: 'Counterpart claims to be abroad / unable to meet',
      advice: 'Buyers or sellers who "cannot come in person" and will handle everything remotely are a common scam setup. Prefer in-person handover or the platform\'s delivery.',
      en: [
        /\bi('m| am) (currently |now )?(abroad|overseas|out of (the )?(country|town)|away on (business|work)|on a (ship|vessel|rig|mission)|in the (military|army|navy)|working offshore|deployed)\b/,
        /\bi (can('t|not)|won't be able to|am unable to) (come|meet|be there|see it|pick it up|collect it) (in person|myself|personally)?\b/,
        /\b(buying|it's|this is) (it )?(as a (gift|surprise|present) )?for my (son|daughter|nephew|niece|mother|father|brother|sister|wife|husband|boss|colleague)\b/,
        /\bmy (agent|assistant|secretary|brother|sister|driver) will (come|pick|collect|handle|take care)\b/,
      ],
      pt: [
        /\b(estou|encontro-me) (de momento |neste momento |atualmente |actualmente )?(fora (do pais|da cidade)|no estrangeiro|no exterior|embarcad[oa]|em missao|em viagem|de viagem|a trabalhar fora|em (franca|suica|inglaterra|alemanha|luxemburgo|angola|brasil))\b/,
        /\bnao (posso|consigo|vou poder|tenho como) (ir|vir|passar|estar|ver|buscar|levantar|recolher)( ai| pessoalmente| em pessoa| buscar)?\b/,
        /\b(e |vai ser |comprar |estou a comprar )?(uma )?(prenda|presente|surpresa) para (o meu|a minha|meu|minha) (filho|filha|sobrinho|sobrinha|mae|pai|irmao|irma|mulher|marido|namorad[oa]|chefe|colega)\b/,
        /\b(o meu|a minha|meu|minha) (agente|assistente|secretari[oa]|irmao|irma|motorista|estafeta) (vai|ira|passa|pode) (ai |la )?(buscar|levantar|recolher|tratar|passar)\b/,
      ],
      es: [
        /\b(estoy|me encuentro) (de momento |ahora mismo |actualmente )?(fuera (del pais|de la ciudad)|en el extranjero|en el exterior|embarcad[oa]|de mision|de viaje|trabajando fuera|en (francia|suiza|inglaterra|alemania|estados unidos|mexico))\b/,
        /\bno (puedo|podre|voy a poder|tengo forma de) (ir|venir|pasar|estar|verlo|verla|recogerlo|recogerla|buscarlo|buscarla)( en persona| personalmente| a por el| a por ella)?\b/,
        /\b(es |va a ser |lo compro |estoy comprando )?(un )?(regalo|sorpresa|detalle) para mi (hijo|hija|sobrino|sobrina|madre|padre|hermano|hermana|mujer|marido|esposa|esposo|novi[oa]|jefe|companer[oa])\b/,
        /\bmi (agente|asistente|secretari[oa]|hermano|hermana|chofer|conductor|mensajero) (ira|va a|pasara|puede) (a )?(recogerlo|recogerla|buscarlo|buscarla|encargarse|pasar)\b/,
      ],
      fr: [
        /\bje suis (actuellement |en ce moment |pour l'instant )?(a l'etranger|hors (du pays|de la ville)|en deplacement|en mission|en voyage|sur un (bateau|navire|chantier|plateforme)|dans l'armee|militaire|en (suisse|belgique|allemagne|angleterre|espagne|afrique))\b/,
        /\bje ne (peux|pourrai|serai) pas (venir|passer|me deplacer|etre la|le voir|la voir|le recuperer|la recuperer|venir le chercher|venir la chercher)( en personne| moi-meme| personnellement)?\b/,
        /\b(c'est |ce sera |je l'achete |j'achete )?(un |une )?(cadeau|surprise) pour (mon|ma) (fils|fille|neveu|niece|mere|pere|frere|soeur|femme|mari|copain|copine|patron|collegue)\b/,
        /\b(mon|ma) (agent|assistant|assistante|secretaire|frere|soeur|chauffeur|coursier) (viendra|va|passera|peut|se chargera) (le |la |de )?(recuperer|chercher|prendre|s'en occuper|passer|tout)\b/,
      ],
    },
    {
      id: 'off-platform', weight: 8, strong: false,
      title: 'Pushing the conversation off the platform',
      advice: 'Scammers move to WhatsApp, Telegram or email so the platform cannot see or block them. Keep the conversation and the payment inside the platform.',
      en: [
        /\b(contact|message|text|write|reach|talk to|call|add|chat with) me (on|via|at|through|by) (whatsapp|telegram|viber|signal|wechat|skype|email|e-mail|gmail|sms|text|my (phone|number|email))\b/,
        /\b(send|give|leave) me your (email|e-mail|phone|number|whatsapp|telegram|contact)\b/,
        /\b(let's|we can|better to|i prefer to|can we) (continue|talk|chat|discuss|communicate|move) (on|via|through|over|to) (whatsapp|telegram|viber|signal|email|e-mail|gmail|sms)\b/,
        /\b(my|here is my|this is my) (whatsapp|telegram|phone|number|email|e-mail)( is| number)?\b.{0,20}(\+?\d[\d\s().-]{7,}\d|@)/,
        /\b[a-z0-9._-]+@(gmail|hotmail|outlook|yahoo|proton|icloud|live)\.(com|me|pt|fr|es)\b/,
      ],
      pt: [
        /\b(contacta|contacte|contata|contate|fala|fale|escreve|escreva|manda|mande|liga|ligue|adiciona|adicione|chama|chame)(-me| comigo| connosco)? (no |pelo |por |via |atraves do |para o |ao |pelo meu )?(whatsapp|telegram|viber|signal|wechat|skype|email|e-mail|gmail|sms|zap|telemovel|numero)\b/,
        /\b(manda|mande|envia|envie|da|de|deixa|deixe|passa|passe)(-me)? (o teu|o seu|teu|seu) (email|e-mail|telefone|telemovel|numero|whatsapp|telegram|contacto|contato)\b/,
        /\b(vamos|podemos|e melhor|prefiro|continuamos|falamos) (continuar |falar |conversar |combinar |tratar )?(no|pelo|por|via|para o|ao) (whatsapp|telegram|viber|signal|email|e-mail|gmail|sms|zap)\b/,
        /\b(o meu|meu|aqui esta o meu|este e o meu) (whatsapp|telegram|telefone|telemovel|numero|email|e-mail|contacto|contato)( e)?\b.{0,20}(\+?\d[\d\s().-]{7,}\d|@)/,
      ],
      es: [
        /\b(contacta|contacte|contactame|contacteme|habla|hable|hablame|hableme|escribe|escriba|escribeme|escribame|manda|mande|mandame|llama|llame|llamame|agrega|agregame|anade|anademe|chatea)(me)? (por|en|al|a mi|a traves de|via|mediante) (whatsapp|telegram|viber|signal|wechat|skype|email|e-mail|correo|gmail|sms|movil|celular|numero|telefono)\b/,
        /\b(manda|mande|mandame|envia|envie|enviame|dame|deme|dejame|dejeme|pasa|pase|pasame|paseme)(me)? (tu|su) (email|e-mail|correo|telefono|movil|celular|numero|whatsapp|telegram|contacto)\b/,
        /\b(vamos a|podemos|mejor|prefiero|seguimos|hablamos) (seguir |hablar |continuar |charlar |tratar )?(por|en|a traves de|via|mediante|al) (whatsapp|telegram|viber|signal|email|e-mail|correo|gmail|sms)\b/,
        /\b(mi|aqui tienes mi|este es mi|te dejo mi) (whatsapp|telegram|telefono|movil|celular|numero|email|e-mail|correo|contacto)( es)?\b.{0,20}(\+?\d[\d\s().-]{7,}\d|@)/,
      ],
      fr: [
        /\b(contactez|contacte|contactez-moi|contacte-moi|ecrivez|ecris|ecrivez-moi|ecris-moi|envoyez|envoie|appelez|appelle|appelez-moi|appelle-moi|ajoutez|ajoute|ajoutez-moi|ajoute-moi|joignez|joins|joignez-moi|joins-moi)(-moi)? (sur|par|via|au|a mon|a travers|a l'adresse) (whatsapp|telegram|viber|signal|wechat|skype|email|e-mail|mail|courriel|gmail|sms|telephone|portable|numero)\b/,
        /\b(envoyez|envoie|donnez|donne|laissez|laisse|passez|passe|communiquez|communique)(-moi)? (votre|ton) (email|e-mail|mail|courriel|adresse mail|telephone|portable|numero|whatsapp|telegram|contact)\b/,
        /\b(on peut|nous pouvons|il vaut mieux|je prefere|continuons|on continue|on se parle|on discute) (continuer |parler |discuter |echanger |communiquer )?(sur|par|via|a travers|au) (whatsapp|telegram|viber|signal|email|e-mail|mail|courriel|gmail|sms)\b/,
        /\b(mon|voici mon|c'est mon|je vous laisse mon|je te laisse mon) (whatsapp|telegram|telephone|portable|numero|email|e-mail|mail|courriel|contact)( est)?\b.{0,20}(\+?\d[\d\s().-]{7,}\d|@)/,
      ],
    },
    {
      id: 'pay-first', weight: 12, strong: false,
      title: 'Payment demanded upfront through an untraceable channel',
      advice: 'Deposits by bank transfer, MB WAY, Bizum, PayPal "friends and family", gift cards or crypto before you have the item cannot be recovered. Use the platform\'s protected payment or pay on collection.',
      en: [
        /\b(pay|payment|deposit|transfer|send) (the |a |half |full |part |some )?(money|amount|deposit|payment|sum|advance|price)? ?(first|upfront|in advance|before|beforehand|today)\b.{0,60}\b(ship|send|post|deliver|dispatch|hold|reserve|keep)\b/,
        /\b(i|we) (only |will )?(ship|send|post|deliver|dispatch) (it |the (item|product|package) )?(after|once|when) (i|we) (receive|get|see|have) (the )?(payment|money|transfer|deposit)\b/,
        /\b(paypal )?(friends (and|&) family|f&f)\b.{0,40}\b(only|please|so (that )?(there (are|is) )?no fees?|avoid (the )?fees?)\b/,
        /\b(pay|payment|send|transfer) (by|via|with|through|using) (bank transfer|wire( transfer)?|western union|moneygram|gift ?cards?|bitcoin|btc|crypto|usdt|revolut|zelle|cash ?app|venmo|paysafe|neosurf|transcash|pcs)\b.{0,40}\b(only|first|before|upfront|now|today|deposit)\b/,
        /\b(reserve|hold|keep) (it |the (item|product) )?(for you )?(with|for|after) (a |the )?(deposit|advance|down payment|small payment)\b/,
      ],
      pt: [
        /\b(paga|pagas|pagar|pague|pagamento|sinal|transfere|transferir|transferencia|envia|enviar|manda|mandar) (o |a |uma |metade |parte |todo |o valor |o sinal |o dinheiro )?(primeiro|antes|adiantad[oa]|antecipad[oa]|hoje|ja)\b.{0,60}\b(envio|envia|enviar|expedir|entrego|entregar|guardo|guardar|reservo|reservar|fica para ti|fica reservado)\b/,
        /\b(so|apenas|somente) (envio|entrego|mando|expedo|despacho) (depois|apos|quando|assim que|logo que) (de )?(receber|ver|confirmar|ter) (o |a )?(pagamento|dinheiro|transferencia|sinal|valor)\b/,
        /\b(paypal )?(amigos (e|&) familia|familia e amigos|friends (and|&) family)\b.{0,40}\b(so|apenas|por favor|sem (taxas?|comissoes?)|para (evitar|nao pagar) (as )?(taxas?|comissoes?))\b/,
        /\b(paga|pagar|pague|pagamento|envia|enviar|transfere|transferir) (por|via|com|atraves de|pelo|pela) (transferencia( bancaria)?|mb ?way|mbway|western union|moneygram|cartoes? (de )?(presente|oferta)|gift ?cards?|bitcoin|btc|cripto|usdt|revolut|paysafe|vale postal)\b.{0,40}\b(so|apenas|somente|primeiro|antes|adiantad[oa]|antecipad[oa]|ja|hoje|sinal)\b/,
        /\b(reservo|guardo|fica (reservad[oa]|guardad[oa]|para ti|para si)) (o artigo |o produto |a peca )?(com|mediante|depois de|apos) (um |o )?(sinal|adiantamento|pagamento parcial|entrada|pequeno valor)\b/,
      ],
      es: [
        /\b(paga|pagas|pagar|pague|pago|senal|transfiere|transferir|transferencia|envia|enviar|manda|mandar|ingresa|ingresar) (el |la |una |mitad |parte |todo |el importe |la senal |el dinero )?(primero|antes|por adelantado|anticipad[oa]|hoy|ya)\b.{0,60}\b(envio|envia|enviar|mando|mandar|entrego|entregar|guardo|guardar|reservo|reservar|queda reservado|te lo reservo)\b/,
        /\b(solo|unicamente|solamente) (envio|entrego|mando|lo envio|lo mando) (despues|tras|cuando|en cuanto|una vez) (de )?(recibir|ver|confirmar|tener) (el )?(pago|dinero|transferencia|senal|ingreso|importe)\b/,
        /\b(paypal )?(amigos (y|&) familia|familia y amigos|friends (and|&) family)\b.{0,40}\b(solo|por favor|sin (comision|comisiones|tasas?)|para (evitar|no pagar) (las? )?(comision|comisiones|tasas?))\b/,
        /\b(paga|pagar|pague|pago|envia|enviar|transfiere|transferir|ingresa|ingresar) (por|via|con|mediante|a traves de) (transferencia( bancaria)?|bizum|western union|moneygram|tarjetas? (de )?regalo|gift ?cards?|bitcoin|btc|cripto|usdt|revolut|paysafe|giro postal)\b.{0,40}\b(solo|unicamente|primero|antes|por adelantado|anticipad[oa]|ya|hoy|senal)\b/,
        /\b(reservo|guardo|queda (reservad[oa]|guardad[oa]|para ti|para usted)|te lo (reservo|guardo)) (el articulo |el producto )?(con|mediante|tras|despues de) (una |la |un )?(senal|anticipo|adelanto|pago parcial|entrada|pequeno importe)\b/,
      ],
      fr: [
        /\b(payez|paye|payer|paiement|acompte|arrhes|virez|vire|virer|virement|envoyez|envoie|envoyer|versez|verse|verser) (le |la |une |un |la moitie |une partie |la totalite |le montant |l'acompte |l'argent )?(d'abord|avant|en avance|a l'avance|aujourd'hui|maintenant)\b.{0,60}\b(envoi|envoie|envoyer|expedie|expedier|livre|livrer|garde|garder|reserve|reserver|mets de cote|mis de cote)\b/,
        /\b(je |nous )?(n')?(envoie|expedie|livre|poste)(rai|rons)? (que |seulement |uniquement )?(apres|une fois|des que|lorsque|quand) (avoir |que j'ai |que j'aurai |que nous avons )?(recu|vu|confirme|encaisse) (le |votre |ton )?(paiement|argent|virement|acompte|reglement)\b/,
        /\b(paypal )?(entre proches|famille et amis|amis et famille|friends (and|&) family)\b.{0,40}\b(seulement|uniquement|s'il vous plait|stp|svp|sans frais|pour (eviter|ne pas payer) (les )?frais)\b/,
        /\b(payez|paye|payer|paiement|envoyez|envoie|envoyer|virez|vire|virer|reglez|regle|regler) (par|via|avec|en|au moyen de) (virement( bancaire)?|mandat( cash)?|western union|moneygram|cartes? cadeaux?|gift ?cards?|bitcoin|btc|crypto|usdt|revolut|lydia|paysafe|neosurf|transcash|coupons? pcs|tickets? premium)\b.{0,40}\b(seulement|uniquement|d'abord|avant|en avance|a l'avance|maintenant|aujourd'hui|acompte)\b/,
        /\b(je (vous|te) (le |la )?(reserve|garde|mets de cote)|c'est reserve|il est reserve|elle est reservee) (l'article |le produit )?(avec|contre|moyennant|apres|des) (un |une |l'|le )?(acompte|arrhes|avance|versement partiel|paiement partiel|petit montant)\b/,
      ],
    },
    {
      id: 'rental-deposit', weight: 15, strong: true,
      title: 'Rental: deposit requested before any viewing',
      advice: 'Never pay a deposit, "reservation" or first month before visiting the property and meeting the landlord. Keys "sent by courier" or payments "handled by Airbnb/Booking" for a classified ad are a scam.',
      en: [
        /\b(send|pay|transfer|wire|make) (the |a )?(deposit|security deposit|first month|first month's rent|reservation fee|holding fee|booking fee)\b.{0,60}\b(before|prior to|without|then|and then|so (that )?(i|we) can) ?(a )?(viewing|visit|seeing|visiting|inspection|sending (the )?keys|reserve)\b/,
        /\b(keys?|contract|documents?) (will be|can be|are) (sent|shipped|delivered|mailed|posted) (to you )?(by|via|through) (courier|post|mail|dhl|ups|fedex|airbnb|booking)\b/,
        /\b(airbnb|booking\.com|booking|tripadvisor|homeaway|vrbo) (will|is going to|shall) (handle|manage|process|hold|secure|take care of) (the )?(payment|deposit|transaction|money|booking)\b/,
        /\b(i|we|the owner|the landlord) (am|is|are) (abroad|overseas|out of the country|in another (city|country)|away)\b.{0,80}\b(keys?|deposit|visit|viewing|rent)\b/,
      ],
      pt: [
        /\b(envia|enviar|envie|paga|pagar|pague|transfere|transferir|faz|fazer|faca) (o |a |um |uma )?(caucao|deposito|sinal|primeira renda|primeiro mes|taxa de reserva|reserva|fianca)\b.{0,60}\b(antes|sem|primeiro|e depois|para (eu|nos|poder)) ?(d[ae] |a |uma )?(visita|visitar|ver|veres|vermos|inspecao|enviar as chaves|reservar)\b/,
        /\b(as )?(chaves?|contrato|documentos?) (serao|sera|vao ser|vai ser|podem ser|pode ser|sao|e) (enviad[oa]s?|entregue?s?|remetid[oa]s?) (por|via|atraves de|pela|pelo) (correio|ctt|transportadora|estafeta|dhl|ups|fedex|airbnb|booking)\b/,
        /\b(airbnb|booking\.com|booking|tripadvisor|vrbo|idealista) (vai|ira|fica a|e quem|sera quem) (tratar|gerir|processar|guardar|segurar|reter|cuidar) (d[oa] |do |da |o |a )?(pagamento|caucao|transacao|dinheiro|reserva)\b/,
        /\b(eu |nos |o proprietario |a proprietaria |o senhorio |a senhoria )?(estou|estamos|esta|encontra-se) (no estrangeiro|fora do pais|noutra cidade|noutro pais|fora|ausente)\b.{0,80}\b(chaves?|caucao|sinal|visita|renda|arrendamento)\b/,
      ],
      es: [
        /\b(envia|enviar|envie|paga|pagar|pague|transfiere|transferir|ingresa|ingresar|haz|hacer|haga|realiza|realizar) (el |la |un |una )?(fianza|deposito|senal|primer mes|primera mensualidad|reserva|tasa de reserva|paga y senal)\b.{0,60}\b(antes|sin|primero|y luego|y despues|para (que )?(yo |nosotros )?(pueda|podamos|poder)) ?(de |la |una )?(visita|visitar|ver|verlo|verla|inspeccion|enviar las llaves|reservar)\b/,
        /\b(las )?(llaves?|contrato|documentos?) (seran|sera|van a ser|va a ser|pueden ser|puede ser|son|es) (enviad[oa]s?|entregad[oa]s?|remitid[oa]s?|mandad[oa]s?) (por|via|a traves de|mediante) (correo|correos|mensajeria|mensajero|transportista|dhl|ups|fedex|seur|airbnb|booking)\b/,
        /\b(airbnb|booking\.com|booking|tripadvisor|vrbo|idealista) (va a|ira a|se encarga de|se encargara de|es quien|sera quien|gestiona|gestionara) (gestionar|tramitar|procesar|guardar|custodiar|retener|ocuparse de)? ?(d?el |la )?(pago|fianza|deposito|transaccion|dinero|reserva)\b/,
        /\b(yo |nosotros |el propietario |la propietaria |el dueno |la duena |el casero |la casera )?(estoy|estamos|esta|se encuentra) (en el extranjero|fuera del pais|en otra ciudad|en otro pais|fuera|ausente)\b.{0,80}\b(llaves?|fianza|deposito|senal|visita|alquiler|renta)\b/,
      ],
      fr: [
        /\b(envoyez|envoie|envoyer|payez|paye|payer|virez|vire|virer|versez|verse|verser|faites|fais|faire|reglez|regle|regler) (la |le |un |une |les |l')?(caution|depot de garantie|acompte|arrhes|premier mois|premier loyer|frais de reservation|reservation|frais de dossier)\b.{0,60}\b(avant|sans|d'abord|puis|ensuite|pour (que )?(je |nous )?(puisse|puissions|pouvoir)) ?(la |une |de |d')?(visite|visiter|voir|inspection|envoyer les cles|reserver)\b/,
        /\b(les )?(cles?|clefs?|contrat|documents?|bail) (seront|sera|vont etre|va etre|peuvent etre|peut etre|sont|est) (envoyees?|envoyes?|envoye|remises?|remis|expediees?|expedies?|livrees?|livres?|postees?|postes?) (par|via|a travers|au moyen de) (courrier|la poste|coursier|transporteur|colissimo|chronopost|dhl|ups|fedex|airbnb|booking)\b/,
        /\b(airbnb|booking\.com|booking|tripadvisor|abritel|vrbo|seloger|leboncoin) (va|ira|se charge de|se chargera de|est charge de|gere|gerera|s'occupe de|s'occupera de) (gerer|traiter|securiser|garder|conserver|retenir|s'occuper de)? ?(le |la |du |de la |l')?(paiement|caution|depot|transaction|argent|reservation)\b/,
        /\b(je |nous |le proprietaire |la proprietaire |le bailleur |la bailleuse )?(suis|sommes|est|se trouve) (a l'etranger|hors du pays|dans une autre ville|dans un autre pays|absent|absente|en deplacement)\b.{0,80}\b(cles?|clefs?|caution|depot|acompte|visite|loyer|location)\b/,
      ],
    },
    {
      id: 'fake-payment-proof', weight: 15, strong: false,
      title: 'Fake payment confirmation or "upgrade to receive"',
      advice: 'Screenshots of "completed transfers" are easily faked, and no bank or platform requires a business account or an upgrade to receive a payment. Check your own account balance, not their screenshot.',
      en: [
        /\b(i|we) (have |already |just )?(made|sent|completed|done|processed) (the |a |your )?(payment|transfer|deposit)\b.{0,80}\b(screenshot|receipt|proof|confirmation|attached|image|photo)\b/,
        /\b(payment|transfer|money) (is |will be |remains )?(pending|on hold|processing|delayed)\b.{0,80}\b(upgrade|business account|merchant account|premium|limit|verify|verification|activate)\b/,
        /\b(you|your account) (need|needs|have|has|must|will have) to (upgrade|be upgraded|become|have|open|activate|verify)\b.{0,40}\b(business|merchant|premium|seller|verified) (account|status|profile|level)\b.{0,60}\b(receive|get|accept|withdraw|release)\b/,
        /\b(pay|deposit|send) (the )?(difference|balance|remaining|missing) (amount|sum|money)? ?(to|so (that )?|before) (upgrade|activate|unlock|release|receive)\b/,
      ],
      pt: [
        /\b(ja |acabei de |acabo de )?(fiz|efetuei|efectuei|realizei|enviei|conclui|processei) (o |a |um |uma |o seu |o teu )?(pagamento|transferencia|deposito)\b.{0,80}\b(print|captura|comprovativo|comprovante|recibo|prova|confirmacao|anexo|imagem|foto)\b/,
        /\b(pagamento|transferencia|dinheiro) (esta|fica|ficara|continua|permanece) (pendente|retid[oa]|em processamento|em espera|atrasad[oa])\b.{0,80}\b(atualizar|actualizar|upgrade|conta (empresarial|business|profissional|de empresa|premium)|limite|verificar|verificacao|ativar|activar)\b/,
        /\b(tens|tem|precisas|precisa|deves|deve|vais ter|vai ter|e preciso|e necessario) (de )?(atualizar|actualizar|fazer upgrade|passar para|ter|abrir|ativar|activar|verificar)\b.{0,40}\b(conta|perfil|estatuto|nivel) (empresarial|business|profissional|de empresa|premium|de vendedor|verificad[oa])\b.{0,60}\b(receber|aceitar|levantar|sacar|libertar|liberar)\b/,
        /\b(paga|pagar|pague|deposita|depositar|envia|enviar) (a |o )?(diferenca|restante|valor em falta|saldo em falta|valor restante)\b.{0,40}\b(para|antes de|e assim) (atualizar|actualizar|ativar|activar|desbloquear|libertar|liberar|receber)\b/,
      ],
      es: [
        /\b(ya |acabo de )?(hice|he hecho|realice|he realizado|envie|he enviado|complete|he completado|efectue|he efectuado|procese) (el |la |un |una |tu |su )?(pago|transferencia|deposito|ingreso)\b.{0,80}\b(captura|pantallazo|comprobante|recibo|justificante|prueba|confirmacion|adjunto|imagen|foto)\b/,
        /\b(pago|transferencia|dinero|ingreso) (esta|queda|quedara|sigue|permanece|se encuentra) (pendiente|retenid[oa]|en proceso|en espera|procesandose|demorad[oa]|retrasad[oa])\b.{0,80}\b(actualizar|mejorar|upgrade|cuenta (empresarial|business|profesional|de empresa|premium|comercial)|limite|verificar|verificacion|activar)\b/,
        /\b(tienes|tiene|necesitas|necesita|debes|debe|vas a tener|va a tener|es necesario|hay) (que )?(actualizar|mejorar|hacer upgrade|pasar a|tener|abrir|activar|verificar)\b.{0,40}\b(cuenta|perfil|estatus|nivel) (empresarial|business|profesional|de empresa|premium|comercial|de vendedor|verificad[oa])\b.{0,60}\b(recibir|aceptar|retirar|cobrar|liberar|desbloquear)\b/,
        /\b(paga|pagar|pague|deposita|depositar|ingresa|ingresar|envia|enviar) (la |el )?(diferencia|restante|importe (que falta|pendiente|restante)|saldo (que falta|pendiente))\b.{0,40}\b(para|antes de|y asi) (actualizar|activar|desbloquear|liberar|recibir|cobrar)\b/,
      ],
      fr: [
        /\b(j'ai |nous avons |je viens de |nous venons de )?(deja )?(fait|effectue|realise|envoye|termine|valide|procede a) (le |un |une |la |votre |ton )?(paiement|virement|depot|reglement)\b.{0,80}\b(capture|screenshot|recu|justificatif|preuve|confirmation|ci-joint|piece jointe|image|photo)\b/,
        /\b(paiement|virement|argent|reglement) (est|reste|restera|demeure|sera) (en attente|bloque|en cours|en traitement|retarde|suspendu)\b.{0,80}\b(mettre a niveau|mise a niveau|upgrade|passer (a|en)|compte (professionnel|pro|business|entreprise|premium|marchand)|plafond|limite|verifier|verification|activer)\b/,
        /\b(vous devez|tu dois|il faut|il vous faut|il te faut|vous avez besoin|tu as besoin|vous allez devoir|tu vas devoir) (de |d')?(mettre a niveau|passer (a|en)|avoir|ouvrir|activer|verifier|obtenir)\b.{0,40}\b(un |une |le |la |votre |ton )?(compte|profil|statut|niveau) (professionnel|pro|business|entreprise|premium|marchand|vendeur|verifie)\b.{0,60}\b(recevoir|accepter|retirer|encaisser|debloquer|liberer)\b/,
        /\b(payez|paye|payer|deposez|depose|deposer|versez|verse|verser|envoyez|envoie|envoyer) (la |le |l')?(difference|reste|restant|montant (manquant|restant)|solde (manquant|restant)|complement)\b.{0,40}\b(pour|avant de|afin de|et ainsi) (mettre a niveau|activer|debloquer|liberer|recevoir|encaisser)\b/,
      ],
    },
    {
      id: 'pressure', weight: 6, strong: false,
      title: 'Pressure to act immediately',
      advice: 'Urgency is used to stop you from thinking. Take your time and verify.',
      en: [
        /\b(i|we) need (it|this|them) (today|now|right now|urgently|asap|immediately|tonight)\b/,
        /\b(i('ll| will)|i can) pay (you )?(extra|more|double|a bonus)\b.{0,40}\b(today|now|right away|if you (ship|send|post|deliver|reserve))\b/,
        /\b(hurry|quick|fast|asap)\b.{0,30}\b(other (buyers?|people)|someone else|before (it's|it is) gone|last chance)\b/,
        /\b(someone|another (buyer|person)) (is )?(also )?(interested|offered|wants)\b.{0,40}\b(decide|now|today|quick|first come)\b/,
      ],
      pt: [
        /\b(preciso|precisamos|necessito) (disto|disso|dele|dela|deles|delas)? ?(para )?(hoje|agora|ja|urgente|urgentemente|com urgencia|o quanto antes|esta noite)\b/,
        /\b(pago|pagamos|posso pagar|dou) (te |lhe )?(mais|extra|a dobrar|o dobro|um bonus|um extra)\b.{0,40}\b(hoje|agora|ja|se (enviares|enviar|mandares|mandar|reservares|reservar|entregares|entregar))\b/,
        /\b(despacha|despache|rapido|depressa|urgente)\b.{0,30}\b(outros? (compradores?|interessados?|pessoas?)|outra pessoa|antes que (va|seja vendido|acabe)|ultima (oportunidade|chance))\b/,
        /\b(ha|tenho) (outro|outra|mais) (comprador|pessoa|interessado|interessada|oferta)\b.{0,40}\b(decide|decida|agora|hoje|rapido|primeiro)\b/,
      ],
      es: [
        /\b(lo |la |los |las )?(necesito|necesitamos) (para )?(hoy|ahora|ya|urgente|urgentemente|con urgencia|cuanto antes|esta noche)\b/,
        /\b(te |le )?(pago|pagamos|puedo pagar|doy) (mas|extra|el doble|un bono|un plus|un extra)\b.{0,40}\b(hoy|ahora|ya|si (lo |la )?(envias|envia|mandas|manda|reservas|reserva|entregas|entrega))\b/,
        /\b(date prisa|dese prisa|rapido|deprisa|urgente)\b.{0,30}\b(otros? (compradores?|interesados?|personas?)|otra persona|antes de que (se venda|se acabe|vuele)|ultima (oportunidad|chance))\b/,
        /\b(hay|tengo) (otro|otra|mas) (comprador|persona|interesado|interesada|oferta)\b.{0,40}\b(decide|decida|ahora|hoy|rapido|primero)\b/,
      ],
      fr: [
        /\b(j'en ai|nous en avons|il me le faut|il me la faut) (besoin )?(pour )?(aujourd'hui|maintenant|tout de suite|urgent|urgemment|d'urgence|au plus vite|ce soir|asap)\b/,
        /\b(je |nous )?(paie|paye|payons|peux payer|pouvons payer|donne|offre) (vous |te |un |une )?(plus|extra|le double|supplement|bonus|prime)\b.{0,40}\b(aujourd'hui|maintenant|tout de suite|si (vous |tu )?(envoyez|envoies|expediez|expedies|reservez|reserves|livrez|livres))\b/,
        /\b(depechez-vous|depeche-toi|vite|rapidement|urgent)\b.{0,30}\b(autres? (acheteurs?|personnes?|interesses?)|quelqu'un d'autre|avant que (ce soit|ca parte|il parte)|derniere (chance|occasion))\b/,
        /\b(j'ai|il y a) (un |une |d')?(autre|autres) (acheteur|acheteurs|personne|personnes|interesse|interesses|offre|offres)\b.{0,40}\b(decidez|decide|maintenant|aujourd'hui|vite|premier)\b/,
      ],
    },
  ];

  const CHAT_THRESHOLD = 15;      // total weight inside a recognised chat area
  const PAGE_THRESHOLD = 20;      // total weight when only "strong" schemes on the whole page are used
  const URL_RE = /\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,24})(?:\/[^\s<>"']*)?/g;

  function isMarketplace(hostname, extraDomains) {
    const h = domain.normalizeHost(hostname);
    const list = MARKETPLACES.concat(extraDomains || []);
    return list.some((d) => domain.isSubdomainOf(h, d));
  }

  /** Hostnames of links mentioned in free text. */
  function linksInText(text) {
    const out = new Set();
    const t = String(text || '').toLowerCase();
    let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(t)) && out.size < 50) {
      const host = m[1];
      if (/^(\d+\.){3}\d+$/.test(host) || host.endsWith('.jpg') || host.endsWith('.png') || host.endsWith('.pdf')) continue;
      out.add(host);
    }
    return Array.from(out);
  }

  /**
   * Analyse conversation text. `source` is 'chat' when the text comes from a
   * recognised chat area, 'page' when it is the whole document.
   * Returns { score, alert, schemes: [{id,title,advice,weight,match,lang}], links }.
   */
  function analyze(text, options) {
    options = options || {};
    const source = options.source || 'chat';
    const currentHost = domain.normalizeHost(options.hostname || '');
    const currentReg = domain.parse(currentHost).registrable;
    const t = phrases.normalize(text);
    const schemes = [];

    for (const s of SCHEMES) {
      if (source === 'page' && !s.strong) continue;
      let hit = null;
      for (const lang of phrases.LANGS) {
        for (const re of (s[lang] || [])) {
          const m = t.match(re);
          if (m) { const k = 'chat_' + s.id.replace(/-/g, '_'); hit = { id: s.id, title: s.title, advice: s.advice, titleKey: k + '_title', adviceKey: k + '_advice', titleArgs: [], adviceArgs: [], weight: s.weight, match: m[0].slice(0, 140), lang }; break; }
        }
        if (hit) break;
      }
      if (hit) schemes.push(hit);
    }

    // Links in the conversation that impersonate a brand (olx-delivery-pay.com, vinted-payment.xyz...)
    const links = [];
    for (const host of linksInText(text)) {
      if (currentReg && domain.isSubdomainOf(host, currentReg)) continue;
      const la = lookalike.detect(host, options.customBrands);
      if (la) {
        links.push({ host, brand: la.brand, reason: la.reason });
      }
    }
    if (links.length) {
      schemes.unshift({ id: 'phishing-link', title: `Link in chat imitates ${links[0].brand}`, advice: `"${links[0].host}" is not a real ${links[0].brand} address. Opening it will lead to a fake payment or login page.`, titleKey: 'chat_phishing_link_title', titleArgs: [links[0].brand], adviceKey: 'chat_phishing_link_advice', adviceArgs: [links[0].host, links[0].brand], weight: 30, match: links[0].host, lang: '-' });
    } else if (source === 'chat') {
      const external = linksInText(text).filter((h) => !(currentReg && domain.isSubdomainOf(h, currentReg)) && !/^(wa\.me|t\.me|youtu\.be|youtube\.com|google\.com|maps\.app\.goo\.gl|goo\.gl)$/.test(h));
      const moneyWords = /\b(pay|payment|paid|card|cartao|pago|pagar|tarjeta|paiement|payer|carte|receive|receber|recibir|recevoir|deliver|entrega|livraison|envio|courier|estafeta|transport)/.test(t);
      if (external.length && moneyWords) schemes.push({ id: 'external-link', title: 'External link sent alongside payment or delivery talk', advice: `Links to ${external[0]} should not be needed to pay or ship. Stay on the platform.`, titleKey: 'chat_external_link_title', titleArgs: [], adviceKey: 'chat_external_link_advice', adviceArgs: [external[0]], weight: 10, match: external[0], lang: '-' });
    }

    const score = schemes.reduce((a, s) => a + s.weight, 0);
    const threshold = source === 'page' ? PAGE_THRESHOLD : CHAT_THRESHOLD;
    schemes.sort((a, b) => b.weight - a.weight);
    return { score, alert: score >= threshold, schemes, links, source };
  }

  return { MARKETPLACES, SCHEMES, CHAT_THRESHOLD, PAGE_THRESHOLD, isMarketplace, linksInText, analyze };
});
