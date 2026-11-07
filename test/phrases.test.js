const test = require('node:test');
const assert = require('node:assert/strict');
const phrases = require('../src/lib/phrases.js');

const cats = (t) => [...new Set(phrases.scan(t).map((p) => p.category))];

test('detects urgency wording in several languages', () => {
  assert.deepEqual(cats('Your account has been suspended. Verify your identity within 24 hours.'), ['urgency']);
  assert.deepEqual(cats('A sua conta foi bloqueada. Ação imediata necessária.'), ['urgency']);
  assert.deepEqual(cats('Su cuenta ha sido suspendida'), ['urgency']);
});

test('detects prize, crypto, tech-support, delivery, payment lures', () => {
  assert.ok(cats('Congratulations, you have been selected! Claim your prize now').includes('prize'));
  assert.ok(cats('Send 0.1 BTC and receive 0.2 BTC back. Guaranteed returns!').includes('crypto'));
  assert.ok(cats('Windows Security Alert: your computer is infected. Call now +1 (888) 555-0199').includes('techsupport'));
  assert.ok(cats('Your package is on hold. Pay the redelivery fee of €1.99 to reschedule').includes('delivery'));
  assert.ok(cats('We only accept gift cards').includes('payment'));
});

test('normal marketing copy does not trigger', () => {
  assert.deepEqual(cats('Welcome to our online store. Free shipping on orders over $50. Create an account to track your orders.'), []);
  assert.deepEqual(cats('Sign in with your email and password. Forgot password? Contact support.'), []);
});

test('matches per category are capped', () => {
  const t = 'act now. act now. final notice. unusual sign-in. immediate action required. your account has been locked. offer ends today';
  assert.ok(phrases.scan(t).filter((p) => p.category === 'urgency').length <= 3);
});

test('money-claim categories in four languages', () => {
  const cases = [
    ['advancefee', 'Pay the processing fee to release your funds', 'Para libertar os seus fundos terá de pagar uma taxa de desbloqueio', 'Para liberar sus fondos debe pagar una tasa de desbloqueo', 'Pour débloquer vos fonds, des frais de traitement doivent être payés avant'],
    ['job', 'Earn up to $3,000 per week working from home, no experience required', 'Ganhe até €1.500 por semana', 'Gana hasta 2000 euros por semana', "Gagnez jusqu'à 3000 € par semaine"],
    ['investment', 'Guaranteed returns of 5% daily', 'Lucros garantidos todos os meses', 'Rendimientos garantizados del 5% diario', 'Rendements garantis de 10% par mois'],
    ['overpayment', 'I sent you too much by mistake, refund the difference', 'Enviei a mais por engano, devolve a diferença', 'Envié de más por error, devuélveme la diferencia', "J'ai envoyé trop par erreur, remboursez la différence"],
    ['lottery', 'You are the beneficiary of unclaimed funds, contact our barrister', 'Fundos não reclamados de um cliente falecido, 4 milhões de dólares', 'Herencia de un cliente fallecido de 4 millones de dólares', "Vous êtes le bénéficiaire de cet héritage de 4 millions d'euros"],
    ['escrow', 'Our shipping agent will hold the funds until you confirm', 'A transportadora guarda o dinheiro até confirmar', 'El transportista retiene el dinero hasta que confirmes', "Le transporteur garde l'argent jusqu'à confirmation"],
    ['loan', 'Guaranteed loan approval, no credit check required', 'Empréstimo aprovado sem consulta ao Banco de Portugal', 'Préstamo aprobado sin consulta a ASNEF', 'Prêt garanti sans justificatif, frais de dossier à payer avant'],
    ['techsupport', 'Your computer is infected. Call now +1 (888) 555-0199', 'O seu computador está infetado. Ligue já 800 123 456', 'Su ordenador está infectado. Llame ahora al 900 123 456', 'Votre ordinateur est infecté. Appelez maintenant le 0800 123 456'],
    ['delivery', 'Your package is on hold, pay the redelivery fee', 'A sua encomenda está retida, pague a taxa de reenvio', 'Su paquete está retenido, pague la tasa de aduana', 'Votre colis est en attente, réglez les frais de livraison'],
    ['prize', 'Congratulations, you have been selected! Claim your prize', 'Parabéns, foi selecionado! Reclame o seu prémio', '¡Enhorabuena, has sido seleccionado! Reclama tu premio', 'Félicitations, vous avez été sélectionné ! Réclamez votre prix'],
  ];
  for (const [cat, ...texts] of cases) {
    texts.forEach((t, i) => {
      const found = phrases.scan(t);
      assert.ok(found.some((p) => p.category === cat), `${cat} [${phrases.LANGS[i]}]: ${t}`);
      assert.ok(found.some((p) => p.category === cat && p.lang === phrases.LANGS[i]), `${cat} language tag [${phrases.LANGS[i]}]`);
    });
  }
});

test('money categories are flagged as money', () => {
  const m = phrases.scan('Guaranteed returns of 5% daily');
  assert.ok(m.length && m.every((p) => p.money));
  const u = phrases.scan('Your account has been suspended');
  assert.ok(u.length && u.every((p) => !p.money));
});

test('benign multilingual copy does not trigger', () => {
  for (const t of [
    'Bienvenue sur notre boutique. Livraison gratuite dès 50€. Créez un compte pour suivre vos commandes.',
    'Bem-vindo à nossa loja. Portes grátis acima de 50€. Crie uma conta para acompanhar as suas encomendas.',
    'Bienvenido a nuestra tienda. Envío gratis a partir de 50€. Crea una cuenta para seguir tus pedidos.',
    'Our savings account pays 3% interest per year. Terms apply.',
  ]) assert.deepEqual(phrases.scan(t), [], t);
});
