/*
 * Social-engineering language that is characteristic of scam pages. Grouped
 * by category; each category has a per-match weight and the scorer caps the
 * total so a long page cannot be flagged on wording alone.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.phrases = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const CATEGORIES = {
    urgency: {
      weight: 6, label: 'Pressure / urgency language',
      patterns: [
        /\b(your|the) account (has been|was|will be|is) (suspended|locked|limited|restricted|disabled|closed|terminated|compromised|deactivated)\b/,
        /\b(verify|confirm|update|validate) your (account|identity|information|details|payment)( information| details)? (within|in|before) \d+ ?(hours?|days?|minutes?)\b/,
        /\bunusual (sign[- ]?in|log[- ]?in|activity|attempt)\b/,
        /\b(immediate|urgent) action (is )?required\b/,
        /\bact (now|immediately|fast)\b/,
        /\bfailure to (verify|respond|update|confirm|comply)\b/,
        /\b(offer|deal|sale) (ends|expires) (in|soon|today|tonight)\b/,
        /\bonly \d+ (items?|units?|spots?|seats?|licen[cs]es?) (left|remaining)\b/,
        /\bdo not (ignore|delay) this\b/,
        /\byour (session|access|subscription) (will|has) (expire|expired|be terminated)\b/,
        /\bwe (have )?(temporarily )?(suspended|limited|restricted) your\b/,
        /\b(final|last) (notice|warning|reminder)\b/,
        // Portuguese / Spanish
        /\b(a sua|sua) conta (foi|ser[áa]|est[áa]) (suspensa|bloqueada|limitada|desativada|restringida)\b/,
        /\b(su|tu) cuenta (ha sido|ser[áa]|est[áa]) (suspendida|bloqueada|limitada|desactivada|restringida)\b/,
        /\b(ac[çc][ãa]o|acci[óo]n) (imediata|inmediata)\b/,
        /\bactividad(e)? (inusual|sospechosa|suspeita)\b/,
      ],
    },
    prize: {
      weight: 10, label: 'Prize / giveaway lure',
      patterns: [
        /\bcongratulations,? you('ve| have)? ?(been selected|won|are the winner|are our winner)\b/,
        /\bclaim your (prize|reward|gift|winnings|free)\b/,
        /\byou (have been|are|were) (randomly )?(selected|chosen) (as|to|for)\b/,
        /\b(lucky|today'?s) (visitor|winner|user)\b/,
        /\bfree (iphone|ipad|macbook|samsung|playstation|ps5|xbox|airpods|gift ?card|voucher)\b/,
        /\b(spin|scratch) (the|to) (wheel|win)\b/,
        /\b(you|user) (won|win) (a|an|the) (free )?(iphone|prize|gift|reward|voucher|car)\b/,
        /\bparab[ée]ns,? (voc[êe] )?(foi (selecionado|escolhido)|ganhou)\b/,
        /\b(felicidades|enhorabuena),? (has sido seleccionado|has ganado|ganaste)\b/,
        /\b(loyalty|fidelity) (reward|gift|program) (for|to) (our )?(customers?|users?)\b/,
      ],
    },
    crypto: {
      weight: 12, label: 'Crypto investment / giveaway lure',
      patterns: [
        /\b(double|2x|triple|3x|multiply) your (bitcoin|btc|eth|ethereum|crypto|investment|money)\b/,
        /\bsend .{0,40}\b(btc|eth|bitcoin|ethereum|usdt|sol)\b.{0,60}\b(receive|get back|we send|we will send|return)\b/,
        /\bguaranteed (returns?|profits?|income|earnings)\b/,
        /\b(airdrop|giveaway|rewards?)\b.{0,60}\b(claim|connect (your )?wallet|eligib)/,
        /\bconnect (your )?wallet to (claim|receive|verify|continue|validate|mint)\b/,
        /\b(seed|recovery|secret|mnemonic|backup) (phrase|words)\b/,
        /\b(12|24)[- ]word (phrase|seed|recovery)\b/,
        /\b\d{1,3}% (daily|weekly|monthly|per day|per week) (returns?|profits?|roi|interest)\b/,
        /\brisk[- ]free (investment|trading|profit)\b/,
        /\b(elon musk|tesla|spacex|michael saylor|vitalik)\b.{0,80}\b(giveaway|bitcoin|btc|eth)\b/,
        /\bvalidate (your )?(wallet|assets|nfts?)\b/,
        /\bwallet (sync|synchroni[sz]ation|validation|rectification|resolve)\b/,
      ],
    },
    techsupport: {
      weight: 15, label: 'Tech-support scam wording',
      patterns: [
        /\byour (computer|pc|mac|device|system|browser|phone) (is|has been|may be) (infected|compromised|blocked|locked|hacked|at risk|damaged)\b/,
        /\b(windows|microsoft|apple|mac|google|norton|mcafee) (security|support|defender|technician)\b.{0,40}\b(alert|warning|call|helpline|toll)/,
        /\bdo not (close|shut ?down|restart|turn off) (this|your) (window|page|browser|computer|pc|device)\b/,
        /\b(virus(es)?|trojans?|spyware|malware|threats?) (has been |have been |were |was )?(detected|found)\b/,
        /\btoll[- ]free\b.{0,40}\b(\+?\d[\d\s().-]{8,}\d)\b/,
        /\bcall (us |now |immediately |support )?(at |on )?(\+?\d[\d\s().-]{8,}\d)\b/,
        /\berror ?(code)? ?#? ?(0x[0-9a-f]{6,}|[a-z]{2,5}-?\d{3,})\b.{0,60}\b(call|contact|support)\b/,
        /\b(license|licence) key (has )?(expired|been blocked)\b/,
        /\b(firewall|security) (alert|warning|notice)\b.{0,60}\b(call|phone|contact|helpline)\b/,
      ],
    },
    payment: {
      weight: 8, label: 'Untraceable payment method requested',
      patterns: [
        /\bpay(ment)? (only |exclusively )?(in|with|via|by|using) (bitcoin|btc|crypto|cryptocurrency|gift ?cards?|itunes cards?|google play cards?|steam cards?|western union|moneygram|wire transfer)\b/,
        /\b(we )?(only )?accept (bitcoin|btc|crypto|cryptocurrency|gift ?cards?|wire transfers?|western union|moneygram)\b/,
        /\b(buy|purchase) (a |an )?(gift ?card|itunes card|google play card|steam card)s? (and|then) (send|read|share|provide)\b/,
        /\b(scratch|read) (the|me) (code|numbers?) (on the back|from the)\b/,
        /\b(pay|pagar|pagamento|pago) .{0,20}\b(bitcoin|cripto|criptomoeda|criptomoneda)\b/,
      ],
    },
    delivery: {
      weight: 10, label: 'Parcel / delivery fee lure',
      patterns: [
        /\b(package|parcel|shipment|delivery|order) (is |was |has been )?(on hold|held|could not be delivered|pending|awaiting|suspended|returned|unable to be delivered|undeliverable)\b/,
        /\b(pay|settle|cover|confirm) .{0,40}\b(redelivery|re-delivery|customs|shipping|handling|import|delivery) (fee|fees|charge|charges|cost|costs|tax|duty)\b/,
        /\b(redelivery|re-delivery|customs|shipping) fee (of|is|:)\s?(\$|€|£|usd|eur|gbp)?\s?\d/,
        /\b(a|sua) encomenda (est[áa]|foi) (retida|suspensa|pendente|a aguardar)\b/,
        /\btaxas? (de )?(alf[âa]ndega|entrega|envio|reexpedi[çc][ãa]o)\b/,
        /\b(su|tu) (paquete|pedido|env[íi]o) (est[áa]|ha sido) (retenido|pendiente|suspendido)\b/,
        /\btasa(s)? de (aduana|env[íi]o|entrega)\b/,
        /\bincorrect (address|postcode|zip code)\b.{0,60}\b(update|confirm|pay)\b/,
      ],
    },
    microfee: {
      weight: 10, label: 'Tiny "processing fee" asking for card details',
      patterns: [
        /\b(fee|charge|cost|payment|taxa|tasa) (of|de|:)?\s?(\$|€|£|usd|eur|gbp)\s?[0-3][.,]\d{2}\b/,
        /\b(\$|€|£)\s?[0-3][.,]\d{2} (fee|charge|shipping|processing|verification|redelivery)\b/,
        /\b(small|nominal|refundable) (fee|charge|deposit|payment)\b/,
        /\b(verify|confirm|validate) your (card|identity|payment method)\b.{0,60}\b(\$|€|£)\s?\d/,
      ],
    },
    fakeproof: {
      weight: 5, label: 'Fake legitimacy claims',
      patterns: [
        /\b(100|one hundred)% (safe|secure|legit|legitimate|guaranteed|verified)\b/,
        /\b(this is|we are) (not|no) (a )?scam\b/,
        /\b(official|authori[sz]ed) (site|website|store|partner|reseller) of\b/,
        /\b(norton|mcafee|verisign|truste|ssl) (secured|verified|protected|trusted)\b/,
        /\bas seen on (tv|forbes|cnn|bbc|fox|shark tank|dragons'? den)\b/,
        /\b(secure|safe) (checkout|payment) (guaranteed|100%)\b/,
      ],
    },
  };

  const MAX_MATCHES_PER_CATEGORY = 3;

  /** Scan lower-cased text, return [{ category, label, weight, match }]. */
  function scan(text) {
    const t = String(text || '').toLowerCase().replace(/\s+/g, ' ');
    const found = [];
    for (const [category, cfg] of Object.entries(CATEGORIES)) {
      let n = 0;
      for (const re of cfg.patterns) {
        const m = t.match(re);
        if (m) {
          found.push({ category, label: cfg.label, weight: cfg.weight, match: m[0].slice(0, 120) });
          if (++n >= MAX_MATCHES_PER_CATEGORY) break;
        }
      }
    }
    return found;
  }

  return { CATEGORIES, scan };
});
