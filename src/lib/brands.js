/*
 * Frequently impersonated brands. `keywords` are the tokens scammers put in
 * hostnames / page titles; `domains` are registrable domains the brand really
 * owns (a page on one of these is never flagged as impersonating that brand).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.brands = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const BRANDS = [
    // Payments & fintech
    { name: 'PayPal', keywords: ['paypal'], domains: ['paypal.com', 'paypal.me', 'paypalobjects.com', 'paypal-community.com'] },
    { name: 'Venmo', keywords: ['venmo'], domains: ['venmo.com'] },
    { name: 'Zelle', keywords: ['zelle'], domains: ['zellepay.com', 'zelle.com'] },
    { name: 'Cash App', keywords: ['cashapp'], domains: ['cash.app', 'squareup.com', 'block.xyz'] },
    { name: 'Wise', keywords: ['transferwise'], domains: ['wise.com', 'transferwise.com'] },
    { name: 'Revolut', keywords: ['revolut'], domains: ['revolut.com', 'revolut.me'] },
    { name: 'N26', keywords: ['n26'], domains: ['n26.com'] },
    { name: 'Stripe', keywords: ['stripe'], domains: ['stripe.com'] },
    { name: 'Klarna', keywords: ['klarna'], domains: ['klarna.com'] },
    { name: 'MB WAY', keywords: ['mbway'], domains: ['mbway.pt', 'sibs.pt'] },
    { name: 'American Express', keywords: ['americanexpress', 'amex'], domains: ['americanexpress.com', 'amex.com', 'aexp.com'] },
    { name: 'Visa', keywords: ['visa'], domains: ['visa.com', 'visa.co.uk', 'visaeurope.com'] },
    { name: 'Mastercard', keywords: ['mastercard'], domains: ['mastercard.com', 'mastercard.us'] },
    // Banks
    { name: 'Chase', keywords: ['chase', 'jpmorgan'], domains: ['chase.com', 'jpmorgan.com', 'jpmorganchase.com'] },
    { name: 'Wells Fargo', keywords: ['wellsfargo'], domains: ['wellsfargo.com', 'wf.com'] },
    { name: 'Bank of America', keywords: ['bankofamerica', 'bofa'], domains: ['bankofamerica.com', 'bofa.com', 'merrilledge.com'] },
    { name: 'Citi', keywords: ['citibank'], domains: ['citi.com', 'citibank.com', 'citigroup.com'] },
    { name: 'Capital One', keywords: ['capitalone'], domains: ['capitalone.com'] },
    { name: 'HSBC', keywords: ['hsbc'], domains: ['hsbc.com', 'hsbc.co.uk', 'hsbc.com.hk', 'us.hsbc.com'] },
    { name: 'Barclays', keywords: ['barclays', 'barclaycard'], domains: ['barclays.co.uk', 'barclays.com', 'barclaycard.co.uk'] },
    { name: 'Lloyds', keywords: ['lloyds', 'lloydsbank'], domains: ['lloydsbank.com', 'lloydsbankinggroup.com', 'lloyds.com'] },
    { name: 'NatWest', keywords: ['natwest'], domains: ['natwest.com', 'natwestgroup.com'] },
    { name: 'Halifax', keywords: ['halifax'], domains: ['halifax.co.uk', 'halifax-online.co.uk'] },
    { name: 'Santander', keywords: ['santander'], domains: ['santander.com', 'santander.co.uk', 'santander.pt', 'santander.es', 'santanderbank.com', 'santandertotta.pt'] },
    { name: 'ING', keywords: ['ingbank', 'ingdirect'], domains: ['ing.com', 'ing.nl', 'ing.be', 'ing.de', 'ing.es', 'ing.com.au'] },
    { name: 'BBVA', keywords: ['bbva'], domains: ['bbva.com', 'bbva.es', 'bbva.mx'] },
    { name: 'CaixaBank', keywords: ['caixabank'], domains: ['caixabank.es', 'caixabank.com'] },
    { name: 'Deutsche Bank', keywords: ['deutschebank'], domains: ['db.com', 'deutsche-bank.de'] },
    { name: 'Caixa Geral de Depósitos', keywords: ['cgd', 'caixadirecta', 'caixageral'], domains: ['cgd.pt', 'caixadirecta.pt'] },
    { name: 'Millennium BCP', keywords: ['millenniumbcp', 'millennium'], domains: ['millenniumbcp.pt', 'bcp.pt'] },
    { name: 'Novo Banco', keywords: ['novobanco'], domains: ['novobanco.pt'] },
    { name: 'BPI', keywords: ['bancobpi'], domains: ['bancobpi.pt', 'bpi.pt'] },
    { name: 'Montepio', keywords: ['montepio'], domains: ['montepio.org', 'montepio.pt', 'bancomontepio.pt'] },
    { name: 'Crédito Agrícola', keywords: ['creditoagricola'], domains: ['creditoagricola.pt'] },
    { name: 'ActivoBank', keywords: ['activobank'], domains: ['activobank.pt'] },
    { name: 'Commonwealth Bank', keywords: ['commbank', 'netbank'], domains: ['commbank.com.au', 'netbank.com.au'] },
    { name: 'TD Bank', keywords: ['tdbank'], domains: ['td.com', 'tdbank.com'] },
    { name: 'RBC', keywords: ['royalbank'], domains: ['rbc.com', 'royalbank.com', 'rbcroyalbank.com'] },
    // Crypto
    { name: 'Coinbase', keywords: ['coinbase'], domains: ['coinbase.com'] },
    { name: 'Binance', keywords: ['binance'], domains: ['binance.com', 'binance.us'] },
    { name: 'Kraken', keywords: ['kraken'], domains: ['kraken.com'] },
    { name: 'MetaMask', keywords: ['metamask'], domains: ['metamask.io'] },
    { name: 'Ledger', keywords: ['ledger'], domains: ['ledger.com'] },
    { name: 'Trezor', keywords: ['trezor'], domains: ['trezor.io'] },
    { name: 'Blockchain.com', keywords: ['blockchain'], domains: ['blockchain.com', 'blockchain.info'] },
    { name: 'Trust Wallet', keywords: ['trustwallet'], domains: ['trustwallet.com'] },
    { name: 'Phantom', keywords: ['phantom'], domains: ['phantom.app', 'phantom.com'] },
    { name: 'OpenSea', keywords: ['opensea'], domains: ['opensea.io'] },
    { name: 'Uniswap', keywords: ['uniswap'], domains: ['uniswap.org', 'app.uniswap.org'] },
    // Tech / cloud
    { name: 'Apple', keywords: ['apple', 'icloud', 'appleid', 'itunes'], domains: ['apple.com', 'icloud.com', 'apple.co', 'itunes.com', 'me.com', 'mac.com', 'apple-dns.net', 'mzstatic.com'] },
    { name: 'Microsoft', keywords: ['microsoft', 'office365', 'outlook', 'onedrive', 'sharepoint', 'hotmail', 'msonline', 'azure', 'xbox'], domains: ['microsoft.com', 'live.com', 'office.com', 'office365.com', 'outlook.com', 'microsoftonline.com', 'sharepoint.com', 'onedrive.com', 'hotmail.com', 'azure.com', 'windows.com', 'msn.com', 'bing.com', 'xbox.com', 'skype.com', 'visualstudio.com', 'azurewebsites.net', 'windows.net', 'microsoft.net', 'msftconnecttest.com', 'linkedin.com', 'github.com', 'microsoftstore.com', 'msauth.net', 'microsoftonline-p.com', 'onmicrosoft.com', 'sharepointonline.com', 'office.net', 'powerbi.com', 'dynamics.com'] },
    { name: 'Google', keywords: ['google', 'gmail', 'youtube', 'gdrive'], domains: ['google.com', 'gmail.com', 'youtube.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com', 'goo.gl', 'g.co', 'google.co.uk', 'google.pt', 'google.de', 'google.fr', 'google.es', 'google.it', 'google.ca', 'google.com.au', 'google.com.br', 'withgoogle.com', 'googleadservices.com', 'googlesyndication.com', 'google-analytics.com', 'googletagmanager.com', 'youtu.be', 'android.com', 'blogger.com', 'blogspot.com', 'firebase.com', 'firebaseapp.com', 'appspot.com', 'googleblog.com', 'ggpht.com', 'googlevideo.com', 'doubleclick.net', 'chrome.com', 'googledrive.com'] },
    { name: 'Amazon', keywords: ['amazon', 'primevideo', 'audible'], domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.com.au', 'amazon.co.jp', 'amazon.in', 'amazon.com.br', 'amazon.com.mx', 'amazon.nl', 'amazon.se', 'amazon.pl', 'amazonaws.com', 'aws.amazon.com', 'primevideo.com', 'audible.com', 'a2z.com', 'amazon.jobs', 'media-amazon.com', 'ssl-images-amazon.com', 'amazonpay.com', 'amazon.dev', 'awsstatic.com', 'cloudfront.net', 'amazontrust.com', 'images-amazon.com'] },
    { name: 'Facebook / Meta', keywords: ['facebook', 'instagram', 'whatsapp', 'messenger', 'metamail'], domains: ['facebook.com', 'fb.com', 'fb.me', 'instagram.com', 'whatsapp.com', 'whatsapp.net', 'messenger.com', 'meta.com', 'fbcdn.net', 'cdninstagram.com', 'facebook.net', 'oculus.com', 'threads.net', 'workplace.com'] },
    { name: 'X / Twitter', keywords: ['twitter'], domains: ['twitter.com', 'x.com', 't.co', 'twimg.com'] },
    { name: 'LinkedIn', keywords: ['linkedin'], domains: ['linkedin.com', 'licdn.com', 'lnkd.in'] },
    { name: 'Netflix', keywords: ['netflix'], domains: ['netflix.com', 'nflxext.com', 'nflximg.net', 'nflxvideo.net'] },
    { name: 'Spotify', keywords: ['spotify'], domains: ['spotify.com', 'scdn.co', 'spotifycdn.com'] },
    { name: 'Disney+', keywords: ['disneyplus'], domains: ['disneyplus.com', 'disney.com', 'disney.co.uk', 'disney.pt', 'bamgrid.com'] },
    { name: 'Dropbox', keywords: ['dropbox'], domains: ['dropbox.com', 'dropboxusercontent.com', 'db.tt', 'dropboxstatic.com'] },
    { name: 'DocuSign', keywords: ['docusign'], domains: ['docusign.com', 'docusign.net'] },
    { name: 'Adobe', keywords: ['adobe', 'acrobat'], domains: ['adobe.com', 'adobelogin.com', 'acrobat.com', 'adobe.io', 'typekit.net', 'adobesign.com', 'adobe.net'] },
    { name: 'Zoom', keywords: ['zoom'], domains: ['zoom.us', 'zoom.com', 'zoomgov.com'] },
    { name: 'Slack', keywords: ['slack'], domains: ['slack.com', 'slack-edge.com'] },
    { name: 'Discord', keywords: ['discord', 'discordapp', 'dicord', 'nitro'], domains: ['discord.com', 'discord.gg', 'discordapp.com', 'discordapp.net', 'discord.gift', 'discord.new', 'discord.media'] },
    { name: 'Telegram', keywords: ['telegram'], domains: ['telegram.org', 't.me', 'telegram.me', 'telegram.dog', 'telesco.pe'] },
    { name: 'Steam', keywords: ['steam', 'steamcommunity', 'steampowered'], domains: ['steampowered.com', 'steamcommunity.com', 'steamgames.com', 'steamstatic.com', 'valvesoftware.com', 'steam-chat.com', 'steamcontent.com', 'steamusercontent.com'] },
    { name: 'Roblox', keywords: ['roblox', 'robux'], domains: ['roblox.com', 'rbxcdn.com'] },
    { name: 'Epic Games', keywords: ['epicgames', 'fortnite'], domains: ['epicgames.com', 'fortnite.com', 'unrealengine.com'] },
    { name: 'PlayStation', keywords: ['playstation'], domains: ['playstation.com', 'sony.com', 'playstation.net', 'sonyentertainmentnetwork.com'] },
    { name: 'Nintendo', keywords: ['nintendo'], domains: ['nintendo.com', 'nintendo.net', 'nintendo.co.uk', 'nintendo.pt'] },
    { name: 'eBay', keywords: ['ebay'], domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.es', 'ebay.it', 'ebaystatic.com', 'ebayimg.com', 'ebay.ca', 'ebay.com.au'] },
    { name: 'Walmart', keywords: ['walmart'], domains: ['walmart.com', 'walmart.ca', 'walmartimages.com'] },
    { name: 'Costco', keywords: ['costco'], domains: ['costco.com', 'costco.ca', 'costco.co.uk'] },
    { name: 'Target', keywords: ['targetstore'], domains: ['target.com'] },
    { name: 'Best Buy', keywords: ['bestbuy'], domains: ['bestbuy.com', 'bestbuy.ca'] },
    { name: 'AliExpress', keywords: ['aliexpress', 'alibaba'], domains: ['aliexpress.com', 'alibaba.com', 'aliexpress.us', 'alicdn.com', 'alipay.com', 'taobao.com'] },
    { name: 'Temu', keywords: ['temu'], domains: ['temu.com'] },
    { name: 'Shein', keywords: ['shein'], domains: ['shein.com', 'shein.co.uk', 'sheincorp.com'] },
    { name: 'Shopify', keywords: ['shopify'], domains: ['shopify.com', 'myshopify.com', 'shopifycdn.com'] },
    { name: 'Booking.com', keywords: ['booking'], domains: ['booking.com', 'bstatic.com'] },
    { name: 'Airbnb', keywords: ['airbnb'], domains: ['airbnb.com', 'airbnb.co.uk', 'airbnb.pt', 'airbnb.es', 'airbnb.fr', 'airbnb.de'] },
    { name: 'Uber', keywords: ['uber', 'ubereats'], domains: ['uber.com', 'ubereats.com'] },
    { name: 'Ticketmaster', keywords: ['ticketmaster'], domains: ['ticketmaster.com', 'ticketmaster.co.uk', 'ticketmaster.pt', 'livenation.com'] },
    // Shipping & postal services (parcel-delivery smishing is huge)
    { name: 'USPS', keywords: ['usps'], domains: ['usps.com', 'usps.gov'] },
    { name: 'UPS', keywords: ['ups'], domains: ['ups.com'] },
    { name: 'FedEx', keywords: ['fedex'], domains: ['fedex.com'] },
    { name: 'DHL', keywords: ['dhl'], domains: ['dhl.com', 'dhl.de', 'dhl.co.uk', 'dhlparcel.com', 'dhlexpress.com', 'dhl.pt', 'mydhl.express.dhl', 'dhlecommerce.com'] },
    { name: 'Royal Mail', keywords: ['royalmail'], domains: ['royalmail.com', 'royalmailgroup.com'] },
    { name: 'CTT', keywords: ['ctt'], domains: ['ctt.pt'] },
    { name: 'Continente', keywords: ['cartaocontinente', 'continente'], domains: ['continente.pt', 'cartaocontinente.pt', 'sonae.pt'] },
    { name: 'Via Verde', keywords: ['viaverde'], domains: ['viaverde.pt', 'brisa.pt'] },
    { name: 'Correos', keywords: ['correos'], domains: ['correos.es', 'correos.com'] },
    { name: 'Canada Post', keywords: ['canadapost'], domains: ['canadapost-postescanada.ca', 'canadapost.ca'] },
    { name: 'Australia Post', keywords: ['auspost'], domains: ['auspost.com.au'] },
    { name: 'Evri', keywords: ['evri', 'hermes'], domains: ['evri.com', 'myhermes.co.uk'] },
    { name: 'La Poste', keywords: ['laposte', 'colissimo'], domains: ['laposte.fr', 'colissimo.fr'] },
    { name: 'Deutsche Post', keywords: ['deutschepost'], domains: ['deutschepost.de'] },
    { name: 'PostNL', keywords: ['postnl'], domains: ['postnl.nl'] },
    // Government / tax
    { name: 'IRS', keywords: ['irs'], domains: ['irs.gov'] },
    { name: 'HMRC', keywords: ['hmrc'], domains: ['gov.uk', 'hmrc.gov.uk', 'tax.service.gov.uk'] },
    { name: 'DVLA', keywords: ['dvla'], domains: ['gov.uk', 'dvla.gov.uk'] },
    { name: 'GOV.UK', keywords: ['govuk'], domains: ['gov.uk', 'service.gov.uk'] },
    { name: 'Autoridade Tributária', keywords: ['financas', 'portaldasfinancas', 'autoridadetributaria'], domains: ['gov.pt', 'portaldasfinancas.gov.pt', 'at.gov.pt'] },
    { name: 'Segurança Social', keywords: ['segurancasocial', 'seg-social'], domains: ['seg-social.pt', 'gov.pt'] },
    { name: 'Social Security Administration', keywords: ['ssa'], domains: ['ssa.gov'] },
    { name: 'Medicare', keywords: ['medicare'], domains: ['medicare.gov', 'cms.gov'] },
    { name: 'Agencia Tributaria', keywords: ['agenciatributaria'], domains: ['agenciatributaria.gob.es', 'agenciatributaria.es'] },
    // Telecom / utilities
    { name: 'Verizon', keywords: ['verizon'], domains: ['verizon.com', 'verizonwireless.com', 'vzw.com'] },
    { name: 'AT&T', keywords: ['att'], domains: ['att.com', 'att.net'] },
    { name: 'T-Mobile', keywords: ['tmobile'], domains: ['t-mobile.com', 't-mobile.pl', 'telekom.de', 't-mobile.nl'] },
    { name: 'Vodafone', keywords: ['vodafone'], domains: ['vodafone.com', 'vodafone.co.uk', 'vodafone.pt', 'vodafone.de', 'vodafone.es', 'vodafone.it'] },
    { name: 'MEO', keywords: ['meo'], domains: ['meo.pt', 'altice.pt'] },
    { name: 'NOS', keywords: ['nos'], domains: ['nos.pt'] },
    { name: 'EDP', keywords: ['edp'], domains: ['edp.pt', 'edp.com'] },
    { name: 'Orange', keywords: ['orange'], domains: ['orange.com', 'orange.fr', 'orange.es', 'orange.pl', 'orange.ro'] },
    { name: 'BT', keywords: ['btinternet'], domains: ['bt.com', 'btinternet.com'] },
    { name: 'Comcast / Xfinity', keywords: ['xfinity', 'comcast'], domains: ['xfinity.com', 'comcast.com', 'comcast.net'] },
    // Misc high-value
    { name: 'Norton', keywords: ['norton', 'lifelock'], domains: ['norton.com', 'lifelock.com', 'nortonlifelock.com'] },
    { name: 'McAfee', keywords: ['mcafee'], domains: ['mcafee.com'] },
    { name: 'Geek Squad', keywords: ['geeksquad'], domains: ['bestbuy.com', 'geeksquad.com'] },
    { name: 'Okta', keywords: ['okta'], domains: ['okta.com', 'oktacdn.com', 'okta-emea.com', 'oktapreview.com'] },
    { name: 'Yahoo', keywords: ['yahoo'], domains: ['yahoo.com', 'yahoo.co.jp', 'yimg.com', 'yahoo.co.uk', 'aol.com'] },
    { name: 'Proton', keywords: ['protonmail'], domains: ['proton.me', 'protonmail.com'] },
    { name: 'GitHub', keywords: ['github'], domains: ['github.com', 'github.io', 'githubusercontent.com', 'githubassets.com'] },
    { name: 'Canva', keywords: ['canva'], domains: ['canva.com'] },
    { name: 'Trezor', keywords: ['trezor'], domains: ['trezor.io'] },
    { name: 'OLX', keywords: ['olx'], domains: ['olx.pt', 'olx.com', 'olx.pl', 'olx.ro', 'olx.ua', 'olx.com.br', 'olx.in', 'olxstatic.com'] },
    { name: 'Vinted', keywords: ['vinted'], domains: ['vinted.com', 'vinted.pt', 'vinted.fr', 'vinted.co.uk', 'vinted.de', 'vinted.es', 'vinted.it', 'vinted.nl', 'vinted.pl', 'vinted.lt'] },
    { name: 'Wallapop', keywords: ['wallapop'], domains: ['wallapop.com'] },
    { name: 'Leboncoin', keywords: ['leboncoin'], domains: ['leboncoin.fr'] },
    { name: 'Marktplaats', keywords: ['marktplaats'], domains: ['marktplaats.nl'] },
    { name: 'Gumtree', keywords: ['gumtree'], domains: ['gumtree.com', 'gumtree.com.au'] },
    { name: 'Craigslist', keywords: ['craigslist'], domains: ['craigslist.org'] },
    { name: 'Kleinanzeigen', keywords: ['kleinanzeigen'], domains: ['kleinanzeigen.de', 'ebay-kleinanzeigen.de'] },
    { name: 'Subito', keywords: ['subito'], domains: ['subito.it'] },
    { name: 'Milanuncios', keywords: ['milanuncios'], domains: ['milanuncios.com'] },
    { name: 'CustoJusto', keywords: ['custojusto'], domains: ['custojusto.pt'] },
    { name: 'Idealista', keywords: ['idealista'], domains: ['idealista.com', 'idealista.pt', 'idealista.it'] },
    { name: 'Mercado Libre', keywords: ['mercadolibre', 'mercadolivre', 'mercadopago'], domains: ['mercadolibre.com', 'mercadolibre.com.ar', 'mercadolibre.com.mx', 'mercadolivre.com.br', 'mercadopago.com', 'mercadopago.com.br', 'mlstatic.com'] },
    { name: 'Depop', keywords: ['depop'], domains: ['depop.com'] },
    { name: 'Etsy', keywords: ['etsy'], domains: ['etsy.com', 'etsystatic.com'] },
    { name: 'Shpock', keywords: ['shpock'], domains: ['shpock.com'] },
    { name: 'Kijiji', keywords: ['kijiji'], domains: ['kijiji.ca'] },
    { name: 'Mobile.de', keywords: ['mobile-de'], domains: ['mobile.de'] },
    { name: 'AutoScout24', keywords: ['autoscout24', 'autoscout'], domains: ['autoscout24.com', 'autoscout24.de', 'autoscout24.pt', 'autoscout24.es', 'autoscout24.fr', 'autoscout24.it'] },
    { name: 'Bizum', keywords: ['bizum'], domains: ['bizum.es'] },
    { name: 'Lydia', keywords: ['lydia'], domains: ['lydia-app.com'] },
    { name: 'Western Union', keywords: ['westernunion'], domains: ['westernunion.com'] },
    { name: 'MoneyGram', keywords: ['moneygram'], domains: ['moneygram.com'] },
    // Added from PhishTank most-targeted brands (2026-11 review)
    { name: 'Allegro', keywords: ['allegro', 'allegrolokalnie'], domains: ['allegro.pl', 'allegrolokalnie.pl', 'allegro.cz', 'allegro.sk', 'allegro.hu', 'allegroimg.com', 'allegrostatic.com', 'allegro.com'] },
    { name: 'Bradesco', keywords: ['bradesco'], domains: ['bradesco.com.br', 'bradesco.com', 'bradescoseguros.com.br', 'next.me'] },
    { name: 'Banco do Brasil', keywords: ['bancodobrasil'], domains: ['bb.com.br', 'bancodobrasil.com.br'] },
    { name: 'Itaú', keywords: ['itau'], domains: ['itau.com.br', 'itau.com', 'itaucard.com.br'] },
    { name: 'Nubank', keywords: ['nubank'], domains: ['nubank.com.br', 'nu.com.br'] },
    { name: 'Optus', keywords: ['optus'], domains: ['optus.com.au', 'optusnet.com.au'] },
    { name: 'Société Générale', keywords: ['societegenerale'], domains: ['societegenerale.fr', 'societegenerale.com', 'particuliers.societegenerale.fr'] },
    { name: 'La Banque Postale', keywords: ['labanquepostale', 'banquepostale'], domains: ['labanquepostale.fr', 'labanquepostale.com'] },
    { name: 'Crédit Agricole', keywords: ['creditagricole', 'credit-agricole'], domains: ['credit-agricole.fr', 'credit-agricole.com', 'ca-cb.com'] },
    { name: 'BNP Paribas', keywords: ['bnpparibas'], domains: ['bnpparibas.com', 'bnpparibas.net', 'mabanque.bnpparibas'] },
    { name: 'Free Mobile', keywords: ['freemobile', 'free-mobile'], domains: ['free.fr', 'free-mobile.fr', 'mobile.free.fr'] },
    { name: 'Ameli (Assurance Maladie)', keywords: ['ameli'], domains: ['ameli.fr', 'assurance-maladie.ameli.fr'] },
    { name: 'impots.gouv.fr', keywords: ['impots', 'impotsgouv'], domains: ['impots.gouv.fr', 'gouv.fr'] },
    { name: 'ANTAI (amendes)', keywords: ['antai', 'amendes'], domains: ['antai.gouv.fr', 'amendes.gouv.fr', 'gouv.fr'] },
    { name: 'SMBC', keywords: ['smbc'], domains: ['smbc.co.jp', 'smbc-card.com', 'smbcgroup.com'] },
    { name: 'Interactive Brokers', keywords: ['interactivebrokers', 'ibkr'], domains: ['interactivebrokers.com', 'ibkr.com', 'interactivebrokers.co.uk', 'interactivebrokers.ie'] },
    { name: 'ABN AMRO', keywords: ['abnamro'], domains: ['abnamro.nl', 'abnamro.com'] },
    { name: 'Rabobank', keywords: ['rabobank'], domains: ['rabobank.nl', 'rabobank.com'] },
    { name: 'DBS', keywords: ['dbsbank', 'posb'], domains: ['dbs.com.sg', 'dbs.com', 'posb.com.sg'] },
    { name: 'Scotiabank', keywords: ['scotiabank', 'scotia'], domains: ['scotiabank.com', 'scotiabank.ca', 'scotiaonline.scotiabank.com'] },
    { name: 'Raiffeisen', keywords: ['raiffeisen'], domains: ['raiffeisen.at', 'raiffeisen.ch', 'raiffeisen.ru', 'rbinternational.com', 'raiffeisenbank.cz', 'raiffeisen.hu', 'raiffeisen.ro', 'raiffeisen.rs', 'raiffeisen.ba', 'raiffeisen.ua', 'volksbank.de', 'vr.de'] },
    { name: 'Swiss Post', keywords: ['swisspost', 'postfinance'], domains: ['post.ch', 'postfinance.ch'] },
    { name: 'Intesa Sanpaolo', keywords: ['intesasanpaolo', 'intesa'], domains: ['intesasanpaolo.com', 'intesasanpaolo.it'] },
    { name: 'UniCredit', keywords: ['unicredit'], domains: ['unicredit.it', 'unicredit.eu', 'unicreditgroup.eu'] },
    { name: 'Poste Italiane', keywords: ['posteitaliane', 'postepay'], domains: ['poste.it', 'postepay.it', 'posteitaliane.it'] },
    { name: 'ABSA', keywords: ['absa'], domains: ['absa.co.za', 'absa.africa'] },
    { name: 'Huntington', keywords: ['huntington'], domains: ['huntington.com'] },
    { name: 'AEON', keywords: ['aeon'], domains: ['aeon.co.jp', 'aeoncard.co.jp'] },
    { name: 'Sparkasse', keywords: ['sparkasse'], domains: ['sparkasse.de', 'sparkasse.at'] },
    { name: 'Commerzbank', keywords: ['commerzbank'], domains: ['commerzbank.de', 'commerzbank.com'] },
    { name: 'Postbank', keywords: ['postbank'], domains: ['postbank.de'] },
    { name: 'DKB', keywords: ['dkb'], domains: ['dkb.de'] },
    { name: 'Hermes (DE)', keywords: ['myhermes'], domains: ['myhermes.de'] },
  ];

  // Keywords this short or this generic only count when they are a whole
  // hostname label, never when they are merely embedded inside one.
  const WHOLE_LABEL_ONLY = new Set(['ups', 'att', 'irs', 'ssa', 'meo', 'nos', 'edp', 'ctt', 'cgd', 'bpi', 'dhl', 'ing', 'amex', 'visa', 'zoom', 'slack', 'okta', 'olx', 'n26', 'apple', 'chase', 'ledger', 'phantom', 'orange', 'target', 'booking', 'steam', 'blockchain', 'millennium', 'hermes', 'nitro', 'evri', 'uber', 'temu', 'bofa', 'kraken', 'canva', 'wise', 'lloyds', 'halifax', 'stripe', 'klarna', 'norton', 'twitter', 'hmrc', 'dvla', 'medicare', 'telegram', 'spotify', 'adobe', 'google', 'subito', 'lydia', 'depop', 'etsy', 'intesa', 'scotia', 'absa', 'aeon', 'dkb', 'posb', 'ameli', 'impots', 'amendes', 'smbc', 'huntington', 'optus', 'continente']);

  // Words that commonly accompany a brand name in phishing hostnames.
  const SUSPICIOUS_TOKENS = [
    'login', 'log-in', 'signin', 'sign-in', 'logon', 'secure', 'security', 'verify', 'verification', 'verified', 'account', 'accounts',
    'update', 'updates', 'support', 'help', 'helpdesk', 'service', 'services', 'center', 'centre', 'auth', 'authentication', 'id',
    'confirm', 'confirmation', 'billing', 'payment', 'payments', 'pay', 'wallet', 'recovery', 'recover', 'reset', 'unlock', 'locked',
    'suspended', 'alert', 'alerts', 'notice', 'notification', 'official', 'online', 'team', 'customer', 'client', 'portal', 'access',
    'session', 'validate', 'validation', 'review', 'case', 'appeal', 'refund', 'invoice', 'delivery', 'parcel', 'package', 'tracking',
    'track', 'redelivery', 'reschedule', 'shipment', 'gift', 'giveaway', 'bonus', 'reward', 'rewards', 'prize', 'claim', 'promo',
    'airdrop', 'mint', 'connect', 'sync', 'app', 'web', 'my', 'mobile', 'info', 'mail', 'email', 'webmail', 'cloud', 'drive', 'docs',
    'share', 'file', 'document', 'signature', 'esign', 'tax', 'refunds', 'rebate', 'benefit', 'benefits', 'renewal', 'renew',
    'subscription', 'membership', 'activate', 'activation', 'kyc', 'identity', 'limited', 'restricted', 'hold', 'unusual', 'activity',
  ];

  const byDomain = new Map();
  for (const b of BRANDS) for (const d of b.domains) byDomain.set(d, b);

  // Closed ".brand" top-level domains: only the brand itself can register
  // names under them (cloud.microsoft, about.google, ...).
  const BRAND_TLDS = {
    microsoft: 'Microsoft', office: 'Microsoft', windows: 'Microsoft', xbox: 'Microsoft', bing: 'Microsoft', azure: 'Microsoft', skype: 'Microsoft',
    google: 'Google', youtube: 'Google', gmail: 'Google', android: 'Google', chrome: 'Google',
    apple: 'Apple', amazon: 'Amazon', aws: 'Amazon', netflix: 'Netflix', barclays: 'Barclays', hsbc: 'HSBC', citi: 'Citi',
    americanexpress: 'American Express', amex: 'American Express', bnpparibas: 'BNP Paribas', santander: 'Santander', bbva: 'BBVA',
    dhl: 'DHL', fedex: 'FedEx', ups: 'UPS', ebay: 'eBay', walmart: 'Walmart',
  };
  const byName = new Map(BRANDS.map((b) => [b.name, b]));

  function findByDomain(registrable) {
    const r = String(registrable || '');
    const hit = byDomain.get(r);
    if (hit) return hit;
    const dot = r.lastIndexOf('.');
    const tld = dot >= 0 ? r.slice(dot + 1) : '';
    return (dot > 0 && Object.prototype.hasOwnProperty.call(BRAND_TLDS, tld) && byName.get(BRAND_TLDS[tld])) || null;
  }

  return { BRANDS, WHOLE_LABEL_ONLY, SUSPICIOUS_TOKENS, BRAND_TLDS, findByDomain };
});
