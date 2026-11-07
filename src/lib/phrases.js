/*
 * Social-engineering language characteristic of scam pages, in English,
 * Portuguese, Spanish and French.
 *
 * Matching is accent-insensitive: scan() lower-cases the text and strips
 * diacritics (ação → acao, está → esta, ç → c, ñ → n), so every pattern
 * below is written WITHOUT accents. Keep \b next to ASCII letters only.
 *
 * Each category has a per-match weight; the scorer caps the total so a long
 * page cannot be flagged on wording alone. Categories in MONEY_CATEGORIES are
 * "money claims": promises or demands involving money that follow well-known
 * fraud templates.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.phrases = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const CUR = '(\\$|€|£|usd|eur|gbp|euros?|dolares|dollars|reais|r\\$)';
  const NUM = '(\\d{1,3}(?:[.,\\s]\\d{3})+|\\d{3,})'; // 3,000 / 3.000 / 3 000 / 3000

  const CATEGORIES = {
    urgency: {
      weight: 6, label: 'Pressure / urgency language',
      en: [
        /\b(your|the) account (has been|was|will be|is) (suspended|locked|limited|restricted|disabled|closed|terminated|compromised|deactivated)\b/,
        /\b(verify|confirm|update|validate) your (account|identity|information|details|payment)( information| details)? (within|in|before) \d+ ?(hours?|days?|minutes?)\b/,
        /\bunusual (sign[- ]?in|log[- ]?in|activity|attempt)\b/,
        /\b(immediate|urgent) action (is )?required\b/,
        /\bact (now|immediately|fast)\b/,
        /\bfailure to (verify|respond|update|confirm|comply)\b/,
        /\b(offer|deal|sale) (ends|expires) (in|soon|today|tonight)\b/,
        /\bonly \d+ (items?|units?|spots?|seats?|licen[cs]es?) (left|remaining)\b/,
        /\byour (session|access|subscription) (will|has) (expire|expired|be terminated)\b/,
        /\bwe (have )?(temporarily )?(suspended|limited|restricted) your\b/,
        /\b(final|last) (notice|warning|reminder)\b/,
      ],
      pt: [
        /\b(a sua|sua|a tua|tua) conta (foi|sera|esta|vai ser) (suspensa|bloqueada|limitada|desativada|restringida|encerrada|cancelada)\b/,
        /\b(verifique|confirme|atualize|valide) (a sua|sua|os seus|seus) (conta|identidade|dados|informacoes|pagamento)\b.{0,30}\b(em|dentro de|antes de) \d+ ?(horas?|dias?|minutos?)\b/,
        /\b(acao|accao) (imediata|urgente)\b/,
        /\batividade (incomum|invulgar|suspeita|inusitada)\b/,
        /\b(oferta|promocao) (termina|expira|acaba) (em|hoje|brevemente)\b/,
        /\b(ultimo|ultima) (aviso|notificacao|lembrete)\b/,
        /\bapenas \d+ (unidades|vagas|itens|artigos) (restantes|disponiveis)\b/,
      ],
      es: [
        /\b(su|tu) cuenta (ha sido|sera|esta|fue) (suspendida|bloqueada|limitada|desactivada|restringida|cerrada|cancelada)\b/,
        /\b(verifique|verifica|confirme|confirma|actualice|actualiza) (su|tu|sus|tus) (cuenta|identidad|datos|informacion|pago)\b.{0,30}\b(en|dentro de|antes de) \d+ ?(horas?|dias?|minutos?)\b/,
        /\b(accion|acción) (inmediata|urgente)\b/,
        /\bactividad (inusual|sospechosa|inusitada)\b/,
        /\b(la )?(oferta|promocion) (termina|expira|acaba|finaliza) (en|hoy|pronto)\b/,
        /\b(ultimo|ultima) (aviso|notificacion|advertencia|recordatorio)\b/,
        /\bsolo (quedan|hay) \d+ (unidades|plazas|articulos)\b/,
      ],
      fr: [
        /\bvotre compte (a ete|sera|est|va etre) (suspendu|bloque|limite|desactive|restreint|ferme|cloture)\b/,
        /\b(verifiez|confirmez|mettez a jour|validez) (votre|vos) (compte|identite|informations|donnees|paiement)\b.{0,30}\b(sous|dans|avant) \d+ ?(heures?|jours?|minutes?)\b/,
        /\baction (immediate|urgente) (est )?(requise|necessaire)\b/,
        /\bactivite (inhabituelle|suspecte)\b/,
        /\b(l')?offre (se termine|expire|prend fin) (dans|aujourd'hui|bientot|ce soir)\b/,
        /\b(dernier|derniere) (avis|avertissement|rappel|relance)\b/,
        /\bplus que \d+ (articles?|places?|unites?) (disponibles?|restants?)\b/,
        /\bagissez (maintenant|vite|immediatement)\b/,
      ],
    },
    prize: {
      weight: 10, label: 'Prize / giveaway lure',
      en: [
        /\bcongratulations,? you('ve| have)? ?(been selected|won|are the winner|are our winner)\b/,
        /\bclaim your (prize|reward|gift|winnings|free)\b/,
        /\byou (have been|are|were) (randomly )?(selected|chosen) (as|to|for)\b/,
        /\b(lucky|today'?s) (visitor|winner|user)\b/,
        /\bfree (iphone|ipad|macbook|samsung|playstation|ps5|xbox|airpods|gift ?card|voucher)\b/,
        /\b(spin|scratch) (the|to) (wheel|win)\b/,
        /\b(loyalty|fidelity) (reward|gift|program) (for|to) (our )?(customers?|users?)\b/,
      ],
      pt: [
        /\bparabens,? (voce |tu )?(foi|foste|acaba de ser|foi o) (selecionado|seleccionado|escolhido|sorteado|contemplado)\b/,
        /\bparabens,? (voce |tu )?(ganhou|ganhaste|venceu)\b/,
        /\b(reclame|resgate|receba|levante) (o seu|seu|o teu|teu) (premio|recompensa|presente|brinde|vale)\b/,
        /\b(voce|tu|o senhor) (foi|foste) (selecionado|escolhido|sorteado) (para|como)\b/,
        /\b(visitante|utilizador|usuario) (sortudo|da sorte|premiado)\b/,
        /\b(iphone|ipad|macbook|samsung|playstation|ps5|xbox|airpods|vale|cartao presente) (gratis|gratuito|de graca)\b/,
        /\b(gire|gira|rode|roda) a roleta\b/,
        /\b(programa de )?(fidelidade|fidelizacao)\b.{0,30}\b(premio|recompensa|presente)\b/,
      ],
      es: [
        /\b(felicidades|enhorabuena|felicitaciones),? (usted |tu )?(ha sido|has sido|fue|fuiste) (seleccionado|elegido|escogido|ganador)\b/,
        /\b(felicidades|enhorabuena|felicitaciones),? (has|ha) ganado\b/,
        /\b(reclama|reclame|canjea|recibe|recoge) (tu|su) (premio|recompensa|regalo|obsequio|vale|cupon)\b/,
        /\b(usted|tu) (ha|has) sido (seleccionado|elegido|escogido) (para|como)\b/,
        /\b(visitante|usuario) (afortunado|ganador|de la suerte)\b/,
        /\b(iphone|ipad|macbook|samsung|playstation|ps5|xbox|airpods|tarjeta regalo|vale) (gratis|gratuito)\b/,
        /\b(gira|girar) la ruleta\b/,
        /\b(programa de )?(fidelidad|lealtad)\b.{0,30}\b(premio|recompensa|regalo)\b/,
      ],
      fr: [
        /\b(felicitations|bravo),? vous (avez ete|etes|avez) (selectionne|choisi|tire au sort|gagne|le gagnant)\b/,
        /\b(reclamez|recuperez|recevez|retirez) votre (prix|recompense|cadeau|lot|gain|bon)\b/,
        /\bvous (avez ete|etes) (selectionne|choisi|tire au sort) (pour|comme|parmi)\b/,
        /\b(visiteur|utilisateur) (chanceux|gagnant|du jour)\b/,
        /\b(iphone|ipad|macbook|samsung|playstation|ps5|xbox|airpods|carte cadeau|bon d'achat) (gratuit|offert)\b/,
        /\b(tournez|faites tourner) la roue\b/,
        /\b(programme de )?fidelite\b.{0,30}\b(cadeau|recompense|prix)\b/,
      ],
    },
    crypto: {
      weight: 12, label: 'Crypto investment / giveaway lure',
      en: [
        /\b(double|2x|triple|3x|multiply) your (bitcoin|btc|eth|ethereum|crypto|investment|money)\b/,
        /\bsend .{0,40}\b(btc|eth|bitcoin|ethereum|usdt|sol)\b.{0,60}\b(receive|get back|we send|we will send|return)\b/,
        /\b(airdrop|giveaway|rewards?)\b.{0,60}\b(claim|connect (your )?wallet|eligib)/,
        /\bconnect (your )?wallet to (claim|receive|verify|continue|validate|mint)\b/,
        /\b(seed|recovery|secret|mnemonic|backup) (phrase|words)\b/,
        /\b(12|24)[- ]word (phrase|seed|recovery)\b/,
        /\b(elon musk|tesla|spacex|michael saylor|vitalik)\b.{0,80}\b(giveaway|bitcoin|btc|eth)\b/,
        /\bvalidate (your )?(wallet|assets|nfts?)\b/,
        /\bwallet (sync|synchroni[sz]ation|validation|rectification|resolve)\b/,
      ],
      pt: [
        /\b(duplique|dobre|triplique|multiplique) (o seu|seu|os seus|seus|a sua) (bitcoin|btc|cripto|criptomoedas?|investimento|dinheiro)\b/,
        /\benvie .{0,40}\b(btc|eth|bitcoin|ethereum|usdt)\b.{0,60}\b(receba|recebera|devolvemos|enviamos|retorno)\b/,
        /\b(airdrop|sorteio|recompensas?)\b.{0,60}\b(reclame|resgate|conecte (a |sua )?carteira|elegiv)/,
        /\b(conecte|ligue|conectar|ligar) (a |sua |tua )?(carteira|wallet) para (reclamar|receber|verificar|continuar|validar)\b/,
        /\b(frase|palavras) (de )?(recuperacao|semente|seed|secreta|backup)\b/,
        /\b(12|24) palavras\b.{0,30}\b(carteira|recuperacao|seed)\b/,
        /\bvalid(e|ar|acao) (da |a |sua )?(carteira|wallet|ativos)\b/,
        /\bsincroniza(r|cao) (da |a |sua )?(carteira|wallet)\b/,
      ],
      es: [
        /\b(duplica|duplique|dobla|triplica|multiplica) (tu|su|tus|sus) (bitcoin|btc|cripto|criptomonedas?|inversion|dinero)\b/,
        /\benvia .{0,40}\b(btc|eth|bitcoin|ethereum|usdt)\b.{0,60}\b(recibe|recibiras|devolvemos|enviamos|retorno)\b/,
        /\b(airdrop|sorteo|recompensas?)\b.{0,60}\b(reclama|reclamar|conecta (tu |su )?(billetera|cartera|wallet)|elegib)/,
        /\b(conecta|conecte|conectar) (tu |su )?(billetera|cartera|wallet|monedero) para (reclamar|recibir|verificar|continuar|validar)\b/,
        /\b(frase|palabras) (de )?(recuperacion|semilla|seed|secreta|respaldo)\b/,
        /\b(12|24) palabras\b.{0,30}\b(billetera|cartera|recuperacion|seed)\b/,
        /\bvalid(a|ar|acion) (de )?(tu |su |la )?(billetera|cartera|wallet|activos)\b/,
        /\bsincroniza(r|cion) (de )?(tu |su |la )?(billetera|cartera|wallet)\b/,
      ],
      fr: [
        /\b(doublez|triplez|multipliez) (vos|votre) (bitcoins?|btc|eth|cryptos?|cryptomonnaies?|investissement|argent|mise)\b/,
        /\benvoyez .{0,40}\b(btc|eth|bitcoin|ethereum|usdt)\b.{0,60}\b(recevez|recevrez|nous (vous )?(renvoyons|envoyons)|retour)\b/,
        /\b(airdrop|cadeau|recompenses?)\b.{0,60}\b(reclamez|connectez (votre )?(portefeuille|wallet)|eligib)/,
        /\bconnectez (votre )?(portefeuille|wallet) pour (reclamer|recevoir|verifier|continuer|valider)\b/,
        /\b(phrase|mots) (de )?(recuperation|secrete|seed|sauvegarde)\b/,
        /\b(12|24) mots\b.{0,30}\b(portefeuille|recuperation|seed)\b/,
        /\bvalid(ez|er|ation) (de )?(votre |vos )?(portefeuille|wallet|actifs)\b/,
        /\bsynchronis(ez|er|ation) (de )?(votre )?(portefeuille|wallet)\b/,
      ],
    },
    techsupport: {
      weight: 15, label: 'Tech-support scam wording',
      en: [
        /\byour (computer|pc|mac|device|system|browser|phone) (is|has been|may be) (infected|compromised|blocked|locked|hacked|at risk|damaged)\b/,
        /\b(windows|microsoft|apple|mac|google|norton|mcafee) (security|support|defender|technician)\b.{0,40}\b(alert|warning|call|helpline|toll)/,
        /\bdo not (close|shut ?down|restart|turn off) (this|your) (window|page|browser|computer|pc|device)\b/,
        /\b(virus(es)?|trojans?|spyware|malware|threats?) (has been |have been |were |was )?(detected|found)\b/,
        /\btoll[- ]free\b.{0,40}\b(\+?\d[\d\s().-]{8,}\d)\b/,
        /\bcall (us |now |immediately |support )?(at |on )?(\+?\d[\d\s().-]{8,}\d)\b/,
        /\berror ?(code)? ?#? ?(0x[0-9a-f]{6,}|[a-z]{2,5}-?\d{3,})\b.{0,60}\b(call|contact|support)\b/,
        /\b(license|licence) key (has )?(expired|been blocked)\b/,
      ],
      pt: [
        /\b(o seu|seu|o teu|teu) (computador|pc|mac|dispositivo|sistema|navegador|telemovel|celular) (esta|foi|pode estar) (infetado|infectado|comprometido|bloqueado|invadido|em risco|danificado)\b/,
        /\b(windows|microsoft|apple|google|norton|mcafee) (seguranca|suporte|tecnico)\b.{0,40}\b(alerta|aviso|ligue|telefone|linha)/,
        /\bnao (feche|desligue|reinicie) (esta|este|o seu|seu) (janela|pagina|navegador|computador|pc|dispositivo)\b/,
        /\b(virus|trojan|spyware|malware|ameacas?) (foi |foram )?(detetad[oa]s?|detectad[oa]s?|encontrad[oa]s?)\b/,
        /\b(ligue|telefone|contacte)(-nos| ja| agora| imediatamente)?\b.{0,20}\b(\+?\d[\d\s().-]{8,}\d)\b/,
        /\b(linha|numero) (gratuita|gratuito|verde)\b.{0,40}\b(\+?\d[\d\s().-]{8,}\d)\b/,
      ],
      es: [
        /\b(su|tu) (ordenador|computadora|pc|mac|dispositivo|sistema|navegador|telefono|movil|celular) (esta|ha sido|puede estar) (infectad[oa]|comprometid[oa]|bloquead[oa]|hackead[oa]|en riesgo|danad[oa])\b/,
        /\b(windows|microsoft|apple|google|norton|mcafee) (seguridad|soporte|tecnico)\b.{0,40}\b(alerta|aviso|llame|llama|telefono|linea)/,
        /\bno (cierre|cierres|apague|apagues|reinicie|reinicies) (esta|este|su|tu) (ventana|pagina|navegador|ordenador|computadora|pc|dispositivo)\b/,
        /\b(virus|troyanos?|spyware|malware|amenazas?) (ha sido |han sido |fue |fueron )?(detectad[oa]s?|encontrad[oa]s?)\b/,
        /\b(llame|llama|contacte|contacta)(nos| ya| ahora| inmediatamente)?\b.{0,20}\b(\+?\d[\d\s().-]{8,}\d)\b/,
        /\b(linea|numero) (gratuit[oa]|sin coste|sin costo)\b.{0,40}\b(\+?\d[\d\s().-]{8,}\d)\b/,
      ],
      fr: [
        /\bvotre (ordinateur|pc|mac|appareil|systeme|navigateur|telephone|mobile) (est|a ete|pourrait etre|peut etre) (infecte|compromis|bloque|verrouille|pirate|en danger|endommage)\b/,
        /\b(windows|microsoft|apple|google|norton|mcafee) (securite|support|assistance|technicien)\b.{0,40}\b(alerte|avertissement|appelez|telephone|numero)/,
        /\bne (fermez|eteignez|redemarrez) pas (cette|votre|ce) (fenetre|page|navigateur|ordinateur|pc|appareil)\b/,
        /\b(virus|chevaux? de troie|spyware|logiciels? (espions?|malveillants?)|menaces?) (a ete |ont ete )?(detecte|detectes|trouve|trouves)\b/,
        /\b(appelez|contactez)(-nous)?( (maintenant|immediatement|le support))?\b.{0,20}\b(\+?\d[\d\s().-]{8,}\d)\b/,
        /\b(numero|ligne) (gratuit|gratuite|vert)\b.{0,40}\b(\+?\d[\d\s().-]{8,}\d)\b/,
      ],
    },
    payment: {
      weight: 8, label: 'Untraceable payment method requested',
      en: [
        /\bpay(ment)? (only |exclusively )?(in|with|via|by|using) (bitcoin|btc|crypto|cryptocurrency|gift ?cards?|itunes cards?|google play cards?|steam cards?|western union|moneygram|wire transfer)\b/,
        /\b(we )?(only )?accept (bitcoin|btc|crypto|cryptocurrency|gift ?cards?|wire transfers?|western union|moneygram)\b/,
        /\b(buy|purchase) (a |an )?(gift ?card|itunes card|google play card|steam card)s? (and|then) (send|read|share|provide)\b/,
        /\b(scratch|read) (the|me) (code|numbers?) (on the back|from the)\b/,
        /\bpaypal (friends|family|friends and family|f&f)\b.{0,30}\b(only|required|must)\b/,
      ],
      pt: [
        /\bpag(ue|amento|ar) (apenas |somente |so )?(em|com|por|via|atraves de) (bitcoin|btc|cripto|criptomoedas?|cartoes? (de )?presente|cartao (de )?oferta|gift ?cards?|western union|moneygram)\b/,
        /\b(so|apenas|somente) (aceitamos|aceito) (bitcoin|btc|cripto|criptomoedas?|cartoes? (de )?presente|gift ?cards?|western union|moneygram|transferencia)\b/,
        /\b(compre|comprar) (um |uns )?(cartao|cartoes) (de )?(presente|oferta|google play|itunes|steam)\b.{0,40}\b(envie|enviar|partilhe|codigo)\b/,
        /\b(raspe|raspar|leia) o codigo (atras|no verso|do cartao)\b/,
      ],
      es: [
        /\bpag(o|ue|a|ar) (solo |unicamente |exclusivamente )?(en|con|por|via|mediante|a traves de) (bitcoin|btc|cripto|criptomonedas?|tarjetas? (de )?regalo|gift ?cards?|western union|moneygram)\b/,
        /\b(solo|unicamente) (aceptamos|acepto) (bitcoin|btc|cripto|criptomonedas?|tarjetas? (de )?regalo|gift ?cards?|western union|moneygram|transferencia)\b/,
        /\b(compra|compre|comprar) (una |unas )?(tarjeta|tarjetas) (de )?(regalo|google play|itunes|steam)\b.{0,40}\b(envia|enviar|comparte|codigo)\b/,
        /\b(rasca|raspa|lee) el codigo (de atras|del reverso|de la tarjeta)\b/,
      ],
      fr: [
        /\bpa(yez|iement|yer) (uniquement |seulement |exclusivement )?(en|par|via|avec) (bitcoin|btc|crypto|cryptomonnaies?|cartes? cadeaux?|coupons? pcs|tickets? premium|transcash|neosurf|paysafecard|western union|moneygram|mandat cash)\b/,
        /\b(nous )?(n')?accept(ons|e) (que|uniquement) (le |les |la )?(bitcoin|btc|crypto|cryptomonnaies?|cartes? cadeaux?|coupons? pcs|tickets? premium|transcash|neosurf|western union|moneygram|virement)\b/,
        /\b(achetez|acheter) (une |des )?(carte|cartes) (cadeau|cadeaux|google play|itunes|steam|pcs|transcash|neosurf)\b.{0,40}\b(envoyez|envoyer|communiquez|code)\b/,
        /\b(grattez|lisez) le code (au dos|a l'arriere|de la carte)\b/,
      ],
    },
    delivery: {
      weight: 10, label: 'Parcel / delivery fee lure',
      en: [
        /\b(package|parcel|shipment|delivery|order) (is |was |has been )?(on hold|held|could not be delivered|pending|awaiting|suspended|returned|unable to be delivered|undeliverable)\b/,
        /\b(pay|settle|cover|confirm) .{0,40}\b(redelivery|re-delivery|customs|shipping|handling|import|delivery) (fee|fees|charge|charges|cost|costs|tax|duty)\b/,
        /\b(redelivery|re-delivery|customs|shipping) fee (of|is|:)\s?(\$|€|£|usd|eur|gbp)?\s?\d/,
        /\bincorrect (address|postcode|zip code)\b.{0,60}\b(update|confirm|pay)\b/,
      ],
      pt: [
        /\b(a |sua |a sua |o |seu |o seu )?(encomenda|pacote|pedido|envio|entrega) (esta|foi|encontra-se|nao pode ser) (retid[oa]|suspens[oa]|pendente|a aguardar|parad[oa]|devolvid[oa]|entregue)\b/,
        /\b(pague|pagar|regularize|liquide|confirme) .{0,40}\b(taxa|taxas|custos?|despesas?) (de )?(reenvio|reexpedicao|alfandega|alfandegaria|entrega|envio|portes|importacao)\b/,
        /\btaxas? (de )?(alfandega|entrega|envio|reexpedicao|importacao)\b.{0,20}\b(de |:)?\s?(\$|€|£|eur)?\s?\d/,
        /\b(morada|endereco|codigo postal) (incorret[oa]|incorrect[oa]|incomplet[oa]|invalid[oa])\b.{0,60}\b(atualize|confirme|pague)\b/,
      ],
      es: [
        /\b(su |tu |el |la )?(paquete|pedido|envio|entrega) (esta|ha sido|fue|no (pudo|ha podido) ser) (retenid[oa]|pendiente|suspendid[oa]|en espera|devuelt[oa]|entregad[oa])\b/,
        /\b(pague|pagar|paga|abone|abonar|confirme) .{0,40}\b(tasa|tasas|gastos?|costes?|costos?|cargos?) (de )?(reenvio|aduana|aduaneros|entrega|envio|importacion|gestion)\b/,
        /\btasas? (de )?(aduana|entrega|envio|reenvio|importacion)\b.{0,20}\b(de |:)?\s?(\$|€|£|eur)?\s?\d/,
        /\b(direccion|codigo postal) (incorrect[oa]|incomplet[oa]|invalid[oa])\b.{0,60}\b(actualice|actualiza|confirme|confirma|pague|paga)\b/,
      ],
      fr: [
        /\b(votre |le |la )?(colis|paquet|commande|envoi|livraison) (est|a ete|n'a pas pu etre|reste) (en attente|retenu|bloque|suspendu|retourne|livre|en instance)\b/,
        /\b(payez|regler|reglez|acquittez|confirmez) .{0,40}\b(frais|taxes?|droits?) (de )?(re-?livraison|douane|douaniers|livraison|expedition|port|importation|gestion|traitement)\b/,
        /\bfrais (de )?(douane|livraison|re-?livraison|expedition|port)\b.{0,20}\b(de |:)?\s?(\$|€|£|eur)?\s?\d/,
        /\b(adresse|code postal) (incorrecte?|incomplete?|invalide|erronee?)\b.{0,60}\b(mettez a jour|confirmez|payez|reglez)\b/,
      ],
    },
    microfee: {
      weight: 10, label: 'Tiny "processing fee" asking for card details',
      en: [
        /\b(fee|charge|cost|payment) (of|:)?\s?(\$|€|£|usd|eur|gbp)\s?[0-3][.,]\d{2}\b/,
        /\b(\$|€|£)\s?[0-3][.,]\d{2} (fee|charge|shipping|processing|verification|redelivery)\b/,
        /\b(small|nominal|refundable) (fee|charge|deposit|payment)\b/,
        /\b(verify|confirm|validate) your (card|identity|payment method)\b.{0,60}\b(\$|€|£)\s?\d/,
      ],
      pt: [
        /\b(taxa|custo|pagamento|valor) (de|:)?\s?(\$|€|£|eur)\s?[0-3][.,]\d{2}\b/,
        /\b(\$|€|£)\s?[0-3][.,]\d{2} (de )?(taxa|portes|envio|processamento|verificacao|reenvio)\b/,
        /\b(pequena|simbolica|reembolsavel) (taxa|quantia|caucao|despesa)\b/,
        /\b(verifique|confirme|valide) (o seu|seu|o teu|teu) (cartao|identidade|metodo de pagamento)\b.{0,60}\b(\$|€|£)\s?\d/,
      ],
      es: [
        /\b(tasa|tarifa|cargo|coste|costo|pago|importe) (de|:)?\s?(\$|€|£|eur)\s?[0-3][.,]\d{2}\b/,
        /\b(\$|€|£)\s?[0-3][.,]\d{2} (de )?(tasa|tarifa|envio|gastos|procesamiento|verificacion|reenvio)\b/,
        /\b(pequena|simbolica|reembolsable) (tasa|tarifa|cantidad|fianza|cuota)\b/,
        /\b(verifique|verifica|confirme|confirma|valide|valida) (su|tu) (tarjeta|identidad|metodo de pago)\b.{0,60}\b(\$|€|£)\s?\d/,
      ],
      fr: [
        /\b(frais|cout|paiement|montant) (de|:)?\s?(\$|€|£|eur)\s?[0-3][.,]\d{2}\b/,
        /\b(\$|€|£)\s?[0-3][.,]\d{2} (de )?(frais|livraison|traitement|verification|re-?livraison)\b/,
        /\b(petits?|symbolique|remboursables?) (frais|montant|caution|depot)\b/,
        /\b(verifiez|confirmez|validez) votre (carte|identite|moyen de paiement)\b.{0,60}\b(\$|€|£)\s?\d/,
      ],
    },
    fakeproof: {
      weight: 5, label: 'Fake legitimacy claims',
      en: [
        /\b(100|one hundred)% (safe|secure|legit|legitimate|guaranteed|verified)\b/,
        /\b(this is|we are) (not|no) (a )?scam\b/,
        /\b(official|authori[sz]ed) (site|website|store|partner|reseller) of\b/,
        /\b(norton|mcafee|verisign|truste|ssl) (secured|verified|protected|trusted)\b/,
        /\bas seen on (tv|forbes|cnn|bbc|fox|shark tank|dragons'? den)\b/,
      ],
      pt: [
        /\b100% (seguro|garantido|verificado|legitimo|confiavel|fiavel)\b/,
        /\b(isto |isso )?nao e (uma )?(burla|fraude|golpe|esquema|scam)\b/,
        /\b(site|loja|parceiro|revendedor) (oficial|autorizad[oa]) d[aeo]\b/,
        /\b(como visto|visto) (na|em) (tv|televisao|forbes|cnn|rtp|sic|tvi|globo)\b/,
      ],
      es: [
        /\b100% (seguro|garantizado|verificado|legitimo|fiable|confiable)\b/,
        /\b(esto )?no es (una )?(estafa|fraude|timo|engano|scam)\b/,
        /\b(sitio|tienda|socio|distribuidor) (oficial|autorizad[oa]) de\b/,
        /\b(como visto|visto) en (tv|television|forbes|cnn|antena 3|telecinco|televisa)\b/,
      ],
      fr: [
        /\b100 ?% (sur|securise|garanti|verifie|legitime|fiable)\b/,
        /\b(ce n'est|ceci n'est) pas (une )?(arnaque|escroquerie|fraude|scam)\b/,
        /\b(site|boutique|partenaire|revendeur) (officiel|officielle|agree|autorise) de\b/,
        /\bvu a la (tele|television|tv)\b/,
      ],
    },

    // ---------------------------------------------------- money claims
    investment: {
      weight: 12, label: 'Unrealistic investment returns promised',
      en: [
        /\bguaranteed (returns?|profits?|income|earnings|monthly income)\b/,
        /\b\d{1,3} ?% (daily|weekly|monthly|per day|per week|per month) (returns?|profits?|roi|interest|yield)\b/,
        /\brisk[- ]free (investment|trading|profit|returns?)\b/,
        /\b(passive income|financial freedom)\b.{0,60}\b(guaranteed|in (just )?\d+ (days|weeks))\b/,
        /\bturn (\$|€|£)\s?\d+ into (\$|€|£)\s?\d+/,
        /\b(trading|forex|binary options?|crypto) (bot|robot|signals?|algorithm)\b.{0,60}\b(guaranteed|\d{2,3} ?%|automatic profit)\b/,
        /\b(limited|exclusive) (investment )?(spots?|places?) (available|left|remaining)\b/,
      ],
      pt: [
        /\b(lucros?|rendimentos?|retornos?|ganhos?|renda) garantid[oa]s?\b/,
        /\b\d{1,3} ?% (ao dia|por dia|diarios?|semanais?|mensais?|ao mes|por mes|por semana)\b.{0,20}\b(lucro|retorno|rendimento|juros)\b/,
        /\b(investimento|lucro|rendimento) sem risco\b/,
        /\b(renda passiva|liberdade financeira)\b.{0,60}\b(garantid[oa]|em (apenas )?\d+ (dias|semanas))\b/,
        /\btransforme (\$|€|r\$)\s?\d+ em (\$|€|r\$)\s?\d+/,
        /\b(robo|bot|sinais) (de )?(trading|forex|cripto|opcoes binarias)\b.{0,60}\b(garantid[oa]|\d{2,3} ?%|lucro automatico)\b/,
        /\b(vagas|lugares) (limitad[oa]s|restantes)\b.{0,40}\b(invest|lucro)/,
      ],
      es: [
        /\b(ganancias?|beneficios?|rendimientos?|retornos?|ingresos?|rentabilidad) garantizad[oa]s?\b/,
        /\b\d{1,3} ?% (diario|diarios|al dia|por dia|semanal|semanales|mensual|mensuales|al mes|por mes|por semana)\b.{0,20}\b(ganancia|beneficio|retorno|rentabilidad|interes)\b/,
        /\b(inversion|ganancia|beneficio|rentabilidad) sin riesgo\b/,
        /\b(ingresos pasivos|libertad financiera)\b.{0,60}\b(garantizad[oa]|en (solo )?\d+ (dias|semanas))\b/,
        /\bconvierte (\$|€)\s?\d+ en (\$|€)\s?\d+/,
        /\b(robot|bot|senales) (de )?(trading|forex|cripto|opciones binarias)\b.{0,60}\b(garantizad[oa]|\d{2,3} ?%|beneficio automatico)\b/,
        /\b(plazas|cupos|lugares) (limitad[oa]s|disponibles|restantes)\b.{0,40}\b(invers|ganancia)/,
      ],
      fr: [
        /\b(rendements?|profits?|gains?|revenus?|benefices?|rentabilite) garantis?\b/,
        /\b\d{1,3} ?% (par jour|quotidien|quotidiens|par semaine|hebdomadaire|par mois|mensuel|mensuels)\b.{0,20}\b(rendement|profit|gain|benefice|interet)\b/,
        /\b(investissement|placement|profit|gain|rendement) sans risque\b/,
        /\b(revenus? passifs?|liberte financiere)\b.{0,60}\b(garantis?|en (seulement )?\d+ (jours|semaines))\b/,
        /\btransformez (\$|€)\s?\d+ en (\$|€)\s?\d+/,
        /\b(robot|bot|signaux) (de )?(trading|forex|crypto|options binaires)\b.{0,60}\b(garantis?|\d{2,3} ?%|profit automatique)\b/,
        /\b(places|inscriptions) (limitees|disponibles|restantes)\b.{0,40}\b(invest|gain)/,
      ],
    },
    // Clone / fake brokers: governments do not license investment firms, regulators do.
    fakeregulator: {
      weight: 20, label: 'Investment firm claims to be licensed by a government',
      en: [
        /\b(investment|trading|brokerage|broker|financial|forex|crypto)\b.{0,120}\b(authori[sz]ed|licen[cs]ed|regulated|approved) by the (uk|united kingdom|british|us|u\.s\.|united states|american|european|eu|portuguese|spanish|french|swiss|australian|canadian) government\b/,
        /\b(authori[sz]ed|licen[cs]ed|regulated) by the (uk|united kingdom|british|us|united states) government\b.{0,80}\b(investment|trading|broker|financial|forex|crypto)\b/,
      ],
      pt: [
        /\b(investimento|investimentos|negociacao|corretora|financeir[ao]|forex|cripto)\b.{0,120}\b(autorizad[ao]|licenciad[ao]|regulad[ao]|aprovad[ao]) pelo governo (do reino unido|britanico|portugues|brasileiro|dos estados unidos|americano|espanhol|frances|suico|europeu)\b/,
        /\b(autorizad[ao]|licenciad[ao]|regulad[ao]) pelo governo (do reino unido|britanico|portugues|brasileiro|dos estados unidos)\b.{0,80}\b(investimento|negociacao|corretora|financeir[ao]|forex|cripto)/,
      ],
      es: [
        /\b(inversion|inversiones|trading|corredora|broker|financier[ao]|forex|cripto)\b.{0,120}\b(autorizad[ao]|licenciad[ao]|regulad[ao]|aprobad[ao]) por el gobierno (del reino unido|britanico|espanol|de espana|de (los )?estados unidos|estadounidense|frances|mexicano|suizo|europeo)\b/,
        /\b(autorizad[ao]|licenciad[ao]|regulad[ao]) por el gobierno (del reino unido|britanico|espanol|de espana|de (los )?estados unidos)\b.{0,80}\b(inversion|trading|corredora|broker|financier[ao]|forex|cripto)/,
      ],
      fr: [
        /\b(investissement|investissements|trading|courtier|financiere?|forex|crypto)\b.{0,120}\b(autorisee?|agreee?|reglementee?|regulee?|licenciee?) par le gouvernement (du royaume-uni|britannique|francais|americain|des etats-unis|espagnol|suisse|europeen)\b/,
        /\b(autorisee?|agreee?|reglementee?|regulee?) par le gouvernement (du royaume-uni|britannique|francais|americain|des etats-unis)\b.{0,80}\b(investissement|trading|courtier|financiere?|forex|crypto)/,
      ],
    },
    // Online trading platform pitch. Legitimate brokers use it too, so it only
    // matters together with other evidence (young domain, fake regulator...).
    brokerplatform: {
      weight: 10, label: 'Online trading / broker platform pitch',
      en: [
        /\b(cfds?|forex|fx|crypto|cryptocurrency|online) trading (firm|platform|company|broker)\b/,
        /\b(open|create) (a |your )?(new |live |real )?(\w+ )?trading account\b/,
        /\bfund(ed)? (your|a) (trading )?account\b|\bfunded (trader|account)\b/,
        /\bprofit (share|split) of up to \d{2,3} ?%/,
      ],
      pt: [
        /\b(plataforma|empresa|corretora) de (negociacao|trading) (de )?(cfds?|forex|cripto|criptomoedas|online)\b/,
        /\b(abra|abrir|crie|criar) (uma |a sua |sua )?conta de (negociacao|trading)\b/,
        /\b(financie|deposite fundos (na|em)) (a sua |sua )?conta\b|\bconta financiada\b/,
        /\b(partilha|divisao) de lucros? (de )?ate \d{2,3} ?%/,
      ],
      es: [
        /\b(plataforma|empresa|firma|corredora) de trading (de )?(cfds?|forex|cripto|criptomonedas|online)\b/,
        /\b(abra|abre|abrir|crea|cree|crear) (una |tu |su )?cuenta de (trading|operaciones|inversion)\b/,
        /\b(financia|fondea|deposita fondos en) (tu|su) cuenta\b|\bcuenta (financiada|fondeada)\b/,
        /\breparto de (beneficios|ganancias) de hasta (el )?\d{2,3} ?%/,
      ],
      fr: [
        /\b(plateforme|societe|courtier) de trading (de )?(cfds?|forex|crypto|cryptomonnaies|en ligne)\b/,
        /\b(ouvrez|ouvrir|creez|creer) (un |votre )?compte de trading\b/,
        /\b(alimentez|approvisionnez|financez) votre compte\b|\bcompte finance\b/,
        /\bpartage des (profits|benefices|gains) (allant )?jusqu'a \d{2,3} ?%/,
      ],
    },
    advancefee: {
      weight: 14, label: 'Advance fee demanded to release money',
      en: [
        /\b(pay|send|transfer|deposit) (a |the |an )?(processing|release|transfer|clearance|activation|legal|administrative|handling|insurance|tax|notary|courier|unlocking) (fee|fees|charge|cost|payment|deposit)\b.{0,80}\b(receive|release|unlock|get|claim|access|before)\b/,
        /\b(funds?|money|payment|winnings|prize|inheritance|loan|grant|compensation) (is|are|will be|has been|have been) (on hold|held|blocked|frozen|pending|delayed) (until|unless|pending|because)\b/,
        /\bto (release|unlock|receive|withdraw) (your|the) (funds?|money|winnings|prize|inheritance|loan|balance|profits?)\b.{0,60}\b(fee|tax|deposit|pay|payment|charge)\b/,
        /\b(fee|tax|deposit|payment) (must be|has to be|needs to be|is) (paid|made|sent) (before|prior to|in advance|upfront|first)\b/,
        /\b(upfront|advance) (fee|payment|deposit) (is )?(required|needed|mandatory)\b/,
      ],
      pt: [
        /\b(pague|pagar|envie|enviar|transfira|transferir|deposite) (uma |a |o )?(taxa|custo|valor|caucao|deposito|seguro|imposto) (de )?(processamento|libertacao|liberacao|transferencia|desbloqueio|ativacao|activacao|administrativ[oa]|legal|notarial|alfandega|seguro|courier|envio)?\b.{0,80}\b(receber|libertar|liberar|desbloquear|levantar|aceder|antes)\b/,
        /\b(fundos?|dinheiro|pagamento|premio|heranca|emprestimo|indemnizacao|compensacao|saldo) (esta|estao|sera|serao|fica|ficam|encontra-se) (retid[oa]s?|bloquead[oa]s?|congelad[oa]s?|pendentes?|suspens[oa]s?) (ate|enquanto|a menos que|porque|por)\b/,
        /\bpara (libertar|liberar|desbloquear|receber|levantar|sacar) (o seu|seu|o teu|teu|os seus|o) (fundos?|dinheiro|premio|heranca|emprestimo|saldo|lucros?)\b.{0,60}\b(taxa|imposto|caucao|deposito|pagar|pagamento)\b/,
        /\b(taxa|imposto|caucao|deposito|pagamento) (deve|tem de|tera de|precisa de) ser (pag[oa]|feit[oa]|enviad[oa]) (antes|antecipadamente|previamente|primeiro)\b/,
        /\b(pagamento|taxa|deposito) (antecipad[oa]|adiantad[oa]|previ[oa]) (e )?(obrigatori[oa]|necessari[oa]|exigid[oa])\b/,
      ],
      es: [
        /\b(pague|pagar|paga|envie|enviar|envia|transfiera|transferir|deposite) (una |la |el )?(tasa|tarifa|cuota|cargo|coste|costo|deposito|fianza|seguro|impuesto) (de )?(procesamiento|liberacion|transferencia|desbloqueo|activacion|administrativ[oa]|legal|notarial|aduana|seguro|mensajeria|envio)?\b.{0,80}\b(recibir|liberar|desbloquear|retirar|cobrar|acceder|antes)\b/,
        /\b(fondos?|dinero|pago|premio|herencia|prestamo|indemnizacion|compensacion|saldo) (esta|estan|sera|seran|queda|quedan|se encuentra) (retenid[oa]s?|bloquead[oa]s?|congelad[oa]s?|pendientes?|suspendid[oa]s?) (hasta|mientras|a menos que|porque|por)\b/,
        /\bpara (liberar|desbloquear|recibir|retirar|cobrar) (su|tu|sus|tus|el|los) (fondos?|dinero|premio|herencia|prestamo|saldo|ganancias?)\b.{0,60}\b(tasa|tarifa|impuesto|fianza|deposito|pagar|pago)\b/,
        /\b(tasa|tarifa|impuesto|fianza|deposito|pago|cuota) (debe|tiene que|tendra que|necesita) ser (pagad[oa]|abonad[oa]|realizad[oa]|enviad[oa]) (antes|por adelantado|previamente|primero)\b/,
        /\b(pago|tasa|deposito|cuota) (por adelantado|anticipad[oa]|previ[oa]) (es )?(obligatori[oa]|necesari[oa]|requerid[oa])\b/,
      ],
      fr: [
        /\b(payez|payer|envoyez|envoyer|virez|virer|versez|verser|deposez) (des |les |une |la |un |le )?(frais|taxe|montant|caution|depot|assurance|impot) (de )?(traitement|deblocage|liberation|transfert|dossier|activation|administratifs?|legaux|notaire|douane|assurance|livraison|coursier)?\b.{0,80}\b(recevoir|debloquer|liberer|retirer|obtenir|acceder|avant)\b/,
        /\b(fonds|argent|paiement|gain|prix|heritage|pret|indemnisation|compensation|solde) (est|sont|sera|seront|reste|restent) (bloque|bloques|bloquee|bloquees|retenu|retenus|retenue|gele|geles|en attente|suspendu|suspendus) (jusqu'|tant que|a moins que|parce que|en raison)/,
        /\bpour (debloquer|liberer|recevoir|retirer|obtenir) (vos|votre|les|le|la) (fonds|argent|gain|gains|prix|heritage|pret|solde|benefices?)\b.{0,60}\b(frais|taxe|caution|depot|payer|paiement)\b/,
        /\b(frais|taxe|caution|depot|paiement) (doit|doivent|devra|devront) etre (paye|payes|payee|regle|regles|verse|verses|envoye|envoyes) (avant|a l'avance|au prealable|d'abord)\b/,
        /\b(paiement|frais|depot|acompte) (a l'avance|anticipe|prealable) (est |sont )?(obligatoire|obligatoires|necessaire|necessaires|requis|exige)\b/,
      ],
    },
    loan: {
      weight: 10, label: 'Loan offer with scam traits',
      en: [
        /\b(guaranteed|instant|100%) (loan )?approval\b/,
        /\bno credit (check|history|score) (required|needed|necessary)?\b.{0,60}\b(loan|credit|cash)\b/,
        /\b(loan|credit|cash) (within|in) (24|48) hours\b.{0,80}\b(fee|deposit|insurance|processing)\b/,
        /\b(pay|send) (the |a )?(insurance|processing|administration|registration|first installment|first instalment) (fee|payment)? ?(before|to|prior to) (receiv|get|releas|obtain)/,
        /\b(bad|poor|no) credit (ok|accepted|welcome|no problem)\b/,
        /\b(private|personal) (lender|investor) (offering|offers|provides) (loans?|credit)\b/,
      ],
      pt: [
        /\b(emprestimo|credito) (aprovado|garantido|imediato) (sem|na hora)\b/,
        /\bsem (consulta|verificacao|analise) (ao |de |do )?(credito|historico|banco de portugal|serasa|spc)\b/,
        /\b(emprestimo|credito|dinheiro) (em|dentro de|ate) (24|48) horas\b.{0,80}\b(taxa|caucao|seguro|deposito|processamento)\b/,
        /\b(pague|pagar|envie|enviar) (o |a |um |uma )?(seguro|taxa|caucao|primeira prestacao|primeira parcela|registo|processamento)\b.{0,40}\b(antes|para) (de )?(receber|libertar|liberar|obter)\b/,
        /\b(mesmo )?(com nome sujo|negativad[oa]|com incidentes|na lista negra)\b/,
        /\b(credor|investidor|financiador) (privado|particular) (oferece|disponibiliza|concede) (emprestimos?|credito)\b/,
      ],
      es: [
        /\b(prestamo|credito) (aprobado|garantizado|inmediato|instantaneo) (sin|al momento|al instante)\b/,
        /\bsin (consulta|verificacion|revision|comprobacion) (de |a |al )?(credito|historial|buro|asnef|rai|experian|datacredito)\b/,
        /\b(prestamo|credito|dinero|efectivo) (en|dentro de|hasta) (24|48) horas\b.{0,80}\b(tasa|tarifa|fianza|seguro|deposito|procesamiento|gestion)\b/,
        /\b(pague|pagar|paga|envie|enviar|envia) (el |la |un |una )?(seguro|tasa|tarifa|fianza|primera cuota|registro|gestion|procesamiento)\b.{0,40}\b(antes|para) (de )?(recibir|liberar|obtener)\b/,
        /\b(con|aunque estes en) (asnef|rai|buro|mal historial|lista negra)\b/,
        /\b(prestamista|inversor|financiador) (privado|particular) (ofrece|concede|otorga) (prestamos?|credito)\b/,
      ],
      fr: [
        /\b(pret|credit) (approuve|garanti|immediat|instantane) (sans|en (24|48) ?h)\b/,
        /\bsans (verification|enquete|consultation|justificatif) (de |du )?(credit|fichier|ficp|banque de france|solvabilite)?\b.{0,40}\b(pret|credit|argent)\b/,
        /\b(pret|credit|argent) (en|sous|dans les) (24|48) heures\b.{0,80}\b(frais|caution|assurance|depot|dossier|traitement)\b/,
        /\b(payez|payer|envoyez|envoyer|versez|verser) (les |l'|des |une |la )?(assurance|frais|caution|premiere mensualite|frais de dossier|enregistrement|traitement)\b.{0,40}\b(avant|pour) (de )?(recevoir|debloquer|obtenir)\b/,
        /\b(fiche|fichage|interdit bancaire|ficp) (accepte|acceptes|ok|pas de probleme)\b/,
        /\b(preteur|investisseur|financier) (prive|particulier) (offre|propose|accorde) (des )?(prets?|credits?)\b/,
      ],
    },
    job: {
      weight: 10, label: 'Job offer with scam traits',
      en: [
        new RegExp('\\b(earn|make) (up to )?' + '(' + CUR + '\\s?' + NUM + '|' + NUM + '\\s?' + CUR + ') (a|per|every|each) (day|week)\\b'),
        /\bwork from home\b.{0,80}\bno (experience|skills|qualifications?) (required|needed|necessary)\b/,
        /\b(pay|send) (a |the )?(registration|training|activation|starter kit|background check|equipment|onboarding) (fee|cost|payment|deposit)\b/,
        /\b(like|rate|review) (videos|products|apps|hotels|restaurants)\b.{0,60}\b(earn|get paid|commission|per task)\b/,
        /\b(complete|do) (simple |easy )?(tasks|orders) (and|to) (earn|get paid|make money)\b/,
        /\b(data entry|envelope stuffing|mystery shopper|package (reshipping|forwarding))\b.{0,80}\b(earn|per (day|week|package)|fee)\b/,
        /\b(reship|forward|receive) (packages|parcels) (from|to) (your|our)\b/,
        /\b(deposit|recharge|top ?up) (your |the )?(account|balance) (to|before) (unlock|withdraw|continue|get) (tasks|earnings|commission)\b/,
      ],
      pt: [
        new RegExp('\\b(ganhe|ganhar|fature|faturar|receba) (ate )?' + '(' + CUR + '\\s?' + NUM + '|' + NUM + '\\s?' + CUR + ') (por|ao|cada) (dia|semana)\\b'),
        /\btrabalh(e|ar|o) (de|em|a partir de) casa\b.{0,80}\bsem (experiencia|qualificacoes?|formacao)\b/,
        /\b(pague|pagar|envie|enviar) (uma |a )?(taxa|valor|custo) (de )?(inscricao|registo|registro|adesao|formacao|treinamento|ativacao|activacao|kit|material|cadastro)\b/,
        /\b(curtir|gostar|avaliar|classificar) (videos|produtos|apps|aplicacoes|hoteis|restaurantes)\b.{0,60}\b(ganhe|ganhar|receba|comissao|por tarefa)\b/,
        /\b(complete|completar|faca|fazer|realize) (tarefas|pedidos|missoes) (simples |faceis )?(e |para )(ganhe|ganhar|receba|receber|lucrar)\b/,
        /\b(recarregue|recarregar|deposite|depositar) (a |o |na |no )?(conta|saldo) para (desbloquear|levantar|sacar|continuar|receber) (tarefas|ganhos|comissao|comissoes)\b/,
        /\b(reenviar|reencaminhar|receber) (encomendas|pacotes|produtos) (de|para) (a sua|sua|a tua|tua|nossa)\b/,
      ],
      es: [
        new RegExp('\\b(gana|ganar|gane|genera|generar|recibe) (hasta )?' + '(' + CUR + '\\s?' + NUM + '|' + NUM + '\\s?' + CUR + ') (al|por|cada) (dia|semana)\\b'),
        /\btrabaj(a|ar|o|e) (desde|en) casa\b.{0,80}\bsin (experiencia|estudios|cualificacion|formacion)\b/,
        /\b(pague|pagar|paga|envie|enviar|envia|abona|abonar) (una |la )?(tasa|cuota|tarifa|coste|costo) (de )?(inscripcion|registro|activacion|formacion|capacitacion|kit|material|alta)\b/,
        /\b(dar (me gusta|like)|valorar|calificar|resenar|puntuar) (videos|productos|apps|aplicaciones|hoteles|restaurantes)\b.{0,60}\b(gana|ganar|cobra|comision|por tarea)\b/,
        /\b(completa|completar|realiza|realizar|haz|hacer) (tareas|pedidos|misiones) (sencillas |simples |faciles )?(y |para )(gana|ganar|cobra|cobrar|recibe|recibir)\b/,
        /\b(recarga|recargar|deposita|depositar) (tu |la |el )?(cuenta|saldo) para (desbloquear|retirar|continuar|recibir) (tareas|ganancias|comision|comisiones)\b/,
        /\b(reenviar|reexpedir|recibir) (paquetes|pedidos|productos) (de|a|hacia) (tu|su|nuestra)\b/,
      ],
      fr: [
        new RegExp('\\b(gagnez|gagner|touchez|recevez) (jusqu\'a )?' + '(' + CUR + '\\s?' + NUM + '|' + NUM + '\\s?' + CUR + ') (par|chaque) (jour|semaine)\\b'),
        /\btravail(lez|ler)? (a|depuis|de) (la )?(maison|domicile)\b.{0,80}\bsans (experience|diplome|qualification|formation)\b/,
        /\b(payez|payer|envoyez|envoyer|reglez|regler) (des |les |une |la )?(frais|droits?|cout) (d'|de )?(inscription|enregistrement|activation|formation|dossier|kit|materiel)\b/,
        /\b(liker|aimer|noter|evaluer) (des )?(videos|produits|applications|apps|hotels|restaurants)\b.{0,60}\b(gagnez|gagner|payes?|commission|par tache)\b/,
        /\b(accomplissez|accomplir|effectuez|effectuer|realisez|realiser) (des )?(taches|commandes|missions) (simples |faciles )?(et |pour )(gagnez|gagner|etre paye|toucher)\b/,
        /\b(rechargez|recharger|deposez|deposer|alimentez) (votre )?(compte|solde) pour (debloquer|retirer|continuer|recevoir) (les )?(taches|gains|commissions?)\b/,
        /\b(reexpedier|renvoyer|recevoir) (des )?(colis|paquets|produits) (de|vers|a) (votre|notre)\b/,
      ],
    },
    overpayment: {
      weight: 12, label: 'Overpayment / refund-the-difference scheme',
      en: [
        /\b(sent|paid|transferred) (you )?(more|extra|too much|the wrong amount)\b.{0,80}\b(refund|send back|return|transfer back) (the )?(difference|balance|excess|rest|remaining)\b/,
        /\b(refund|send back|return|wire back) (me )?(the )?(difference|excess|overpayment|extra amount|balance)\b/,
        /\b(cheque|check|money order) (for|of) (more than|an amount exceeding|a higher amount)\b/,
        /\b(by mistake|accidentally|in error)\b.{0,60}\b(refund|send back|return)\b.{0,40}\b(difference|excess|balance)\b/,
      ],
      pt: [
        /\b(enviei|paguei|transferi|enviou|pagou) (a mais|em excesso|demais|o valor errado|um valor superior)\b.{0,80}\b(devolv|reembols|envie de volta|transfira de volta)\w*\b.{0,30}\b(diferenca|excesso|restante|resto)\b/,
        /\b(devolva|devolver|reembolse|reembolsar|envie de volta|transfira de volta) (me )?(a |o )?(diferenca|excesso|valor a mais|restante|resto)\b/,
        /\b(cheque|vale postal) (de|com|por) (um )?(valor|montante) (superior|maior|a mais)\b/,
        /\b(por engano|por erro|acidentalmente|sem querer)\b.{0,60}\b(devolv|reembols)\w*\b.{0,40}\b(diferenca|excesso|restante)\b/,
      ],
      es: [
        /\b(envie|pague|transferi|envio|pago|transfirio) (de mas|en exceso|demasiado|el importe equivocado|una cantidad superior)\b.{0,80}\b(devuelv|devolv|reembols|reintegr|transfier)\w*\b.{0,30}\b(diferencia|exceso|sobrante|resto|restante)\b/,
        /\b(devuelve|devuelva|devolver|reembolsa|reembolse|reintegra|transfiere de vuelta) (me )?(la |el )?(diferencia|exceso|sobrante|importe de mas|resto|restante)\b/,
        /\b(cheque|giro postal) (de|con|por) (un )?(importe|valor|monto|cantidad) (superior|mayor|de mas)\b/,
        /\b(por error|por equivocacion|accidentalmente|sin querer)\b.{0,60}\b(devuelv|devolv|reembols|reintegr)\w*\b.{0,40}\b(diferencia|exceso|sobrante)\b/,
      ],
      fr: [
        /\b(envoye|paye|vire|verse) (trop|en trop|plus que|le mauvais montant|un montant superieur)\b.{0,80}\b(rembours|renvoy|retourn|revir)\w*\b.{0,30}\b(difference|excedent|surplus|reste|solde)\b/,
        /\b(remboursez|rembourser|renvoyez|renvoyer|retournez|retourner|revirez) (moi )?(la |le |l')?(difference|excedent|surplus|trop-?percu|montant en trop|reste|solde)\b/,
        /\b(cheque|mandat) (d'un|de|pour un) montant (superieur|plus eleve)\b/,
        /\b(par erreur|par megarde|accidentellement|par inadvertance)\b.{0,60}\b(rembours|renvoy|retourn)\w*\b.{0,40}\b(difference|excedent|surplus|solde)\b/,
      ],
    },
    lottery: {
      weight: 12, label: 'Lottery / inheritance / unclaimed funds lure',
      en: [
        /\b(unclaimed|dormant|abandoned) (funds?|money|account|inheritance|balance)\b/,
        /\bnext of kin\b/,
        /\b(sole |legal )?beneficiary (of|to) (the |this |an? )?(estate|funds?|inheritance|sum|fortune|account)\b/,
        /\b(lottery|lotto|sweepstakes?|raffle) (winner|winning|award|notification|prize|payout)\b/,
        /\b(compensation|grant|relief|covid|government|un|united nations|imf|world bank) (fund|award|payment|package)\b.{0,80}\b(contact|claim|agent|beneficiar|release)\b/,
        /\b(deceased|late) (client|customer|relative|depositor)\b.{0,80}\b(funds?|million|usd|account|share)\b/,
        /\b(barrister|attorney|solicitor|diplomat|bank manager|auditor)\b.{0,80}\b(million|usd|funds?|transfer|share|percent|%)\b/,
        /\b(consignment|trunk box|atm card) (box|containing|loaded with)\b/,
      ],
      pt: [
        /\b(fundos?|dinheiro|conta|heranca|saldo|valores?) (nao reclamad[oa]s?|por reclamar|abandonad[oa]s?|dormentes?|inativ[oa]s?)\b/,
        /\b(parente|familiar|herdeiro) (mais )?proximo\b/,
        /\b(unic[oa] |legitim[oa] )?beneficiari[oa] (d[aeo]|desta|deste) (heranca|fundos?|quantia|fortuna|conta|espolio)\b/,
        /\b(loteria|lotaria|sorteio|euromilhoes|rifa) (vencedor|premiad[oa]|premio|notificacao|pagamento)\b/,
        /\b(indemnizacao|compensacao|subsidio|fundo) (do governo|das nacoes unidas|da onu|do fmi|do banco mundial|covid)\b.{0,80}\b(contacte|contate|reclame|agente|beneficiari|libert)/,
        /\b(cliente|familiar|depositante) (falecid[oa]|defunt[oa])\b.{0,80}\b(fundos?|milhoes|dolares|euros|conta|percentagem|parte)\b/,
        /\b(advogad[oa]|notari[oa]|diplomata|gerente (de |do )banco|auditor)\b.{0,80}\b(milhoes|dolares|fundos?|transferencia|percentagem|parte|%)\b/,
      ],
      es: [
        /\b(fondos?|dinero|cuenta|herencia|saldo) (no reclamad[oa]s?|sin reclamar|abandonad[oa]s?|inactiv[oa]s?|durmientes?)\b/,
        /\b(pariente|familiar|heredero) (mas )?(cercano|proximo)\b/,
        /\b(unic[oa] |legitim[oa] )?beneficiari[oa] (de|para) (la |este |esta |los |un |una )?(herencia|fondos?|suma|fortuna|cuenta|patrimonio)\b/,
        /\b(loteria|lotto|sorteo|rifa|euromillones|primitiva) (ganador|premiad[oa]|premio|notificacion|pago)\b/,
        /\b(indemnizacion|compensacion|subvencion|ayuda|fondo) (del gobierno|de las naciones unidas|de la onu|del fmi|del banco mundial|covid)\b.{0,80}\b(contacte|contacta|reclame|reclama|agente|beneficiari|liber)/,
        /\b(cliente|familiar|depositante) (fallecid[oa]|difunt[oa])\b.{0,80}\b(fondos?|millones|dolares|euros|cuenta|porcentaje|parte)\b/,
        /\b(abogad[oa]|notari[oa]|diplomatic[oa]|gerente (de |del )banco|auditor)\b.{0,80}\b(millones|dolares|fondos?|transferencia|porcentaje|parte|%)\b/,
      ],
      fr: [
        /\b(fonds|argent|compte|heritage|somme|solde) (non reclames?|non reclame|en desherence|dormants?|abandonnes?|inactifs?)\b/,
        /\b(plus proche parent|proche parent|heritier|ayant droit)\b/,
        /\b(seul |unique |legitime )?beneficiaire (de|du|des|d') ?(cet |cette |la |l'|un |une )?(heritage|fonds|somme|fortune|compte|succession)\b/,
        /\b(loterie|loto|tirage au sort|euromillions|tombola) (gagnant|gagnante|gain|prix|notification|paiement)\b/,
        /\b(indemnisation|compensation|subvention|aide|fonds) (du gouvernement|des nations unies|de l'onu|du fmi|de la banque mondiale|covid)\b.{0,80}\b(contactez|reclamez|agent|beneficiaire|debloqu)/,
        /\b(client|parent|deposant) (decede|defunt)\b.{0,80}\b(fonds|millions|dollars|euros|compte|pourcentage|part)\b/,
        /\b(avocat|notaire|diplomate|directeur de banque|auditeur|huissier)\b.{0,80}\b(millions|dollars|fonds|transfert|pourcentage|part|%)\b/,
      ],
    },
    escrow: {
      weight: 12, label: 'Fake escrow / payment held by a third party',
      en: [
        /\b(our|the|an?) (escrow|shipping|transport|delivery|courier|logistics) (agent|company|service|partner) (will |shall )?(hold|holds|keep|keeps|receive|collect)s? (the |your )?(funds?|payment|money)\b/,
        /\b(payment|money|funds?) (will be|is|are|gets) (released|transferred|sent|paid out) (to you )?(once|after|when|as soon as) (you |the )?(confirm|pay|receive|accept|ship|cover)\b/,
        /\b(insurance|shipping|transport|delivery|customs) (fee|deposit|cost) (for|to|before) (ship|release|deliver|receiv)/,
        /\b(secure|safe|guaranteed) (transaction|payment|delivery) (service|system|program|protection)\b.{0,60}\b(pay|fee|deposit|insurance)\b/,
        /\b(money|funds|payment) (is |are )?(safe|secure|held|kept) (with|by|in) (us|our|the) (agent|company|escrow|account)\b/,
      ],
      pt: [
        /\b(a |o |nossa |nosso )?(transportadora|estafeta|empresa de (transporte|entrega|logistica)|agente|servico de entrega|courier|intermediari[oa]) (vai |ira |fica a )?(guardar|guarda|reter|retem|reter|receber|recebe|cobrar|cobra) (o |a |os )?(dinheiro|pagamento|fundos|valor)\b/,
        /\b(pagamento|dinheiro|valor|fundos) (sera|e|fica|vai ser) (libertad[oa]|liberad[oa]|transferid[oa]|enviad[oa]|pag[oa]) (quando|assim que|depois de|apos|logo que) (voce |tu |o |a )?(confirmar|confirme|pagar|pague|receber|receba|aceitar|enviar|cobrir)\b/,
        /\b(seguro|portes|transporte|entrega|alfandega)\b.{0,20}\b(taxa|caucao|custo|valor)\b.{0,30}\b(para|antes de) (enviar|libertar|liberar|entregar|receber)\b/,
        /\b(transacao|pagamento|entrega) (segur[oa]|garantid[oa]|protegid[oa])\b.{0,60}\b(pague|pagar|taxa|caucao|seguro)\b/,
        /\b(dinheiro|fundos|pagamento) (esta|fica|ficam|estao) (segur[oa]s?|guardad[oa]s?|retid[oa]s?) (com|por|n[ao]) (nos|nossa|nosso|a|o) (agente|empresa|conta|intermediari)/,
      ],
      es: [
        /\b(el |la |nuestr[oa] |un |una )?(transportista|mensajero|empresa de (transporte|envio|mensajeria|logistica)|agente|servicio de entrega|courier|intermediari[oa]) (va a |ira a |se encarga de )?(guardar|guarda|retener|retiene|recibir|recibe|cobrar|cobra) (el |la |los )?(dinero|pago|fondos|importe)\b/,
        /\b(pago|dinero|importe|fondos) (sera|es|queda|se) (liberad[oa]|transferid[oa]|enviad[oa]|pagad[oa]|liberara|transferira|enviara) (cuando|en cuanto|despues de|tras|una vez que) (usted |tu |el |la )?(confirme|confirmes|pague|pagues|reciba|recibas|acepte|aceptes|envie|envies|cubra)\b/,
        /\b(seguro|envio|transporte|entrega|aduana)\b.{0,20}\b(tasa|tarifa|fianza|coste|costo|importe)\b.{0,30}\b(para|antes de) (enviar|liberar|entregar|recibir)\b/,
        /\b(transaccion|pago|entrega) (segur[oa]|garantizad[oa]|protegid[oa])\b.{0,60}\b(pague|pagar|paga|tasa|fianza|seguro)\b/,
        /\b(dinero|fondos|pago) (esta|queda|quedan|estan) (segur[oa]s?|guardad[oa]s?|retenid[oa]s?|custodiad[oa]s?) (con|por|en) (nosotros|nuestr[oa]|el|la) (agente|empresa|cuenta|intermediari)/,
      ],
      fr: [
        /\b(le |la |notre |un |une )?(transporteur|livreur|coursier|societe de (transport|livraison|logistique)|agent|service de livraison|intermediaire|tiers de confiance) (va |ira |se charge de )?(garder|garde|conserver|conserve|retenir|retient|recevoir|recoit|encaisser|encaisse) (l'|le |les |votre )?(argent|paiement|fonds|montant)\b/,
        /\b(paiement|argent|montant|fonds) (sera|est|reste|seront|sont) (debloque|debloques|libere|liberes|transfere|transferes|envoye|envoyes|verse|verses) (une fois|des que|apres|lorsque|quand) (que )?(vous |le |la )?(confirm|pay|recev|accept|envoy|regl|couvr)/,
        /\b(assurance|livraison|transport|expedition|douane)\b.{0,20}\b(frais|caution|cout|montant)\b.{0,30}\b(pour|avant de|avant l') ?(envoyer|expedier|debloquer|liberer|livrer|recevoir)\b/,
        /\b(transaction|paiement|livraison) (securise|securisee|garanti|garantie|protege|protegee)\b.{0,60}\b(payez|payer|frais|caution|assurance)\b/,
        /\b(argent|fonds|paiement) (est|sont|reste|restent) (en securite|securise|securises|garde|gardes|retenu|retenus|bloque|bloques|conserve|conserves) (chez|par|aupres de|sur) (nous|notre|le|la|l') ?(agent|societe|compte|intermediaire|tiers)/,
      ],
    },
  };

  const MONEY_CATEGORIES = ['investment', 'fakeregulator', 'brokerplatform', 'advancefee', 'loan', 'job', 'overpayment', 'lottery', 'escrow', 'payment', 'microfee', 'crypto'];
  const LANGS = ['en', 'pt', 'es', 'fr'];
  const MAX_MATCHES_PER_CATEGORY = 3;

  /** Lower-case and strip diacritics so one ASCII pattern matches é/è/ê/ẽ… */
  function normalize(text) {
    let t = String(text || '').toLowerCase();
    try { t = t.normalize('NFKD').replace(/[̀-ͯ]/g, ''); } catch (e) { /* ignore */ }
    return t.replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ');
  }

  function patternsOf(cfg) {
    const all = [];
    for (const lang of LANGS) for (const re of (cfg[lang] || [])) all.push({ re, lang });
    return all;
  }

  /** Scan text, return [{ category, label, weight, match, lang, money }]. */
  function scan(text) {
    const t = normalize(text);
    const found = [];
    for (const [category, cfg] of Object.entries(CATEGORIES)) {
      let n = 0;
      for (const { re, lang } of patternsOf(cfg)) {
        const m = t.match(re);
        if (m) {
          found.push({ category, label: cfg.label, key: 'phrase_' + category, weight: cfg.weight, match: m[0].slice(0, 120), lang, money: MONEY_CATEGORIES.includes(category) });
          if (++n >= MAX_MATCHES_PER_CATEGORY) break;
        }
      }
    }
    return found;
  }

  return { CATEGORIES, MONEY_CATEGORIES, LANGS, normalize, scan };
});
