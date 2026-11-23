/*
 * Frequently impersonated brands. `keywords` are the tokens scammers put in
 * hostnames / page titles; `domains` are registrable domains the brand really
 * owns (a page on one of these is never flagged as impersonating that brand).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.brands = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // Country sites: cc('amazon', 'ae sa com.tr') -> amazon.ae, amazon.sa, amazon.com.tr.
  // Global brands run one storefront per country; a missing one is flagged as fake.
  function cc(base, suffixes) { return suffixes.split(/\s+/).filter(Boolean).map((s) => base + '.' + s); }

  const BRANDS = [
    // Payments & fintech
    { name: 'PayPal', keywords: ['paypal'], domains: ['paypal.com', 'paypal.me', 'paypalobjects.com', 'paypal-community.com', 'paypal.de'] },
    { name: 'Venmo', keywords: ['venmo'], domains: ['venmo.com'] },
    { name: 'Zelle', keywords: ['zelle'], domains: ['zellepay.com', 'zelle.com'] },
    { name: 'Cash App', keywords: ['cashapp'], domains: ['cash.app', 'squareup.com', 'block.xyz'] },
    { name: 'Wise', keywords: ['transferwise'], domains: ['wise.com', 'transferwise.com'] },
    { name: 'Revolut', keywords: ['revolut'], domains: ['revolut.com', 'revolut.me'] },
    { name: 'N26', keywords: ['n26'], domains: ['n26.com'] },
    { name: 'Stripe', keywords: ['stripe'], domains: ['stripe.com', 'stripe.network', 'stripe.dev', 'stripe-terminal-local-reader.net'] },
    { name: 'Klarna', keywords: ['klarna'], domains: ['klarna.com', 'klarna.net'] },
    { name: 'MB WAY', keywords: ['mbway'], domains: ['mbway.pt', 'sibs.pt'] },
    { name: 'American Express', keywords: ['americanexpress', 'amex'], domains: ['americanexpress.com', 'amex.com', 'aexp.com'] },
    { name: 'Visa', keywords: ['visa'], domains: ['visa.com', 'visa.co.uk', 'visaeurope.com', ...cc('visa', 'cn fr de co.jp com.br com.ar')] },
    { name: 'Mastercard', keywords: ['mastercard'], domains: ['mastercard.com', 'mastercard.us', ...cc('mastercard', 'de org com.au co.jp')] },
    // Banks
    { name: 'Chase', keywords: ['chase', 'jpmorgan'], domains: ['chase.com', 'jpmorgan.com', 'jpmorganchase.com', 'chase.co.uk'] },
    { name: 'Wells Fargo', keywords: ['wellsfargo'], domains: ['wellsfargo.com', 'wf.com', 'wellsfargo.net'] },
    { name: 'Bank of America', keywords: ['bankofamerica', 'bofa'], domains: ['bankofamerica.com', 'bofa.com', 'merrilledge.com'] },
    { name: 'Citi', keywords: ['citibank'], domains: ['citi.com', 'citibank.com', 'citigroup.com', 'citibank.com.br', 'citibank.com.sg', 'citibank.com.hk', 'citibankonline.com'] },
    { name: 'Capital One', keywords: ['capitalone'], domains: ['capitalone.com', 'capitalone.ca', 'capitalone.co.uk'] },
    { name: 'HSBC', keywords: ['hsbc'], domains: ['hsbc.com', 'hsbc.co.uk', 'hsbc.com.hk', 'us.hsbc.com', ...cc('hsbc', 'com.sg com.mx net uk com.br com.au com.cn co.in')] },
    { name: 'Barclays', keywords: ['barclays', 'barclaycard'], domains: ['barclays.co.uk', 'barclays.com', 'barclaycard.co.uk'] },
    { name: 'Lloyds', keywords: ['lloyds', 'lloydsbank'], domains: ['lloydsbank.com', 'lloydsbankinggroup.com', 'lloyds.com', 'lloydsbank.co.uk'] },
    { name: 'NatWest', keywords: ['natwest'], domains: ['natwest.com', 'natwestgroup.com'] },
    { name: 'Halifax', keywords: ['halifax'], domains: ['halifax.co.uk', 'halifax-online.co.uk'] },
    { name: 'Santander', keywords: ['santander'], domains: ['santander.com', 'santander.co.uk', 'santander.pt', 'santander.es', 'santanderbank.com', 'santandertotta.pt', ...cc('santander', 'com.br com.mx cl com.ar de com.uy')] },
    { name: 'ING', keywords: ['ingbank', 'ingdirect'], domains: ['ing.com', 'ing.nl', 'ing.be', 'ing.de', 'ing.es', 'ing.com.au', 'ingbank.pl', 'ingbank.com.tr', 'ingdirect.es'] },
    { name: 'BBVA', keywords: ['bbva'], domains: ['bbva.com', 'bbva.es', 'bbva.mx', ...cc('bbva', 'com.ar pe com.co com.uy')] },
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
    { name: 'TD Bank', keywords: ['tdbank'], domains: ['td.com', 'tdbank.com', 'tdbank.ca'] },
    { name: 'RBC', keywords: ['royalbank'], domains: ['rbc.com', 'royalbank.com', 'rbcroyalbank.com'] },
    // Crypto
    { name: 'Coinbase', keywords: ['coinbase'], domains: ['coinbase.com'] },
    { name: 'Binance', keywords: ['binance'], domains: ['binance.com', 'binance.us', 'binance.vision', 'binance.org'] },
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
    { name: 'Apple', keywords: ['apple', 'icloud', 'appleid', 'itunes'], domains: ['apple.com', 'icloud.com', 'apple.co', 'itunes.com', 'me.com', 'mac.com', 'apple-dns.net', 'mzstatic.com', 'apple.news', 'icloud.com.cn', 'apple.com.cn', 'apple.cn', 'apple.co.jp', 'cdn-apple.com', 'icloud-content.com', 'apple-cloudkit.com', 'apple-mapkit.com', 'apple-dns.cn', 'icloud-content.com.cn'] },
    { name: 'Microsoft', keywords: ['microsoft', 'office365', 'outlook', 'onedrive', 'sharepoint', 'hotmail', 'msonline', 'azure', 'xbox'], domains: ['microsoft.com', 'live.com', 'office.com', 'office365.com', 'outlook.com', 'microsoftonline.com', 'sharepoint.com', 'onedrive.com', 'hotmail.com', 'azure.com', 'windows.com', 'msn.com', 'bing.com', 'xbox.com', 'skype.com', 'visualstudio.com', 'azurewebsites.net', 'windows.net', 'microsoft.net', 'msftconnecttest.com', 'linkedin.com', 'github.com', 'microsoftstore.com', 'msauth.net', 'microsoftonline-p.com', 'onmicrosoft.com', 'sharepointonline.com', 'office.net', 'powerbi.com', 'dynamics.com', 'microsoftazuread-sso.com', 'office365.us', 'azure.net', 'microsoft.us', 'azure.us', 'sharepoint.us', 'azure.cn', 'outlook.cn', 'sharepoint.cn', 'office365.cn', 'outlook.de', 'microsoft.ai', 'onedrive.us', 'sharepoint.de', 'microsoft.de', 'azurefd.net', 'azure-dns.com', 'azure-dns.net', 'azure-dns.org', 'azure-dns.info', 'azure-devices.net', 'azure-api.net', 's-microsoft.com', 'xboxservices.com', 'microsoft365.com', 'tm-azurefd.net', 'azurefd.us', 'azure-devices-provisioning.net', 'azurecr.io', 'azure-apim.net', 'microsoftonline.us', 'microsoftonline.cn', 'microsoftapp.net', 'azure-dns.de', 'azure-dns.cn', 'microsoftonline-p.net', 'azure-automation.net', 'azureml.ms', 'azure-apihub.net', 'microsoft.github.io', 'int-azure-api.net', 'azure-int.net', 'office365-net.us', 'sharepoint-mil.us', 'azure-dns-1.cn', 'azure-dns-2.cn'] },
    { name: 'Google', keywords: ['google', 'gmail', 'youtube', 'gdrive'], domains: ['google.com', 'gmail.com', 'youtube.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com', 'goo.gl', 'g.co', 'google.co.uk', 'google.pt', 'google.de', 'google.fr', 'google.es', 'google.it', 'google.ca', 'google.com.au', 'google.com.br', 'withgoogle.com', 'googleadservices.com', 'googlesyndication.com', 'google-analytics.com', 'googletagmanager.com', 'youtu.be', 'android.com', 'blogger.com', 'blogspot.com', 'firebase.com', 'firebaseapp.com', 'appspot.com', 'googleblog.com', 'ggpht.com', 'googlevideo.com', 'doubleclick.net', 'chrome.com', 'googledrive.com', 'google.play', ...cc('google', 'ad ae com.af com.ag al am co.ao com.ar as at az ba com.bd be bf bg com.bh bi bj com.bn com.bo bs bt co.bw by com.bz cd cf cg ch ci co.ck cl cm cn com.co co.cr com.cu cv com.cy cz dj dk dm com.do dz com.ec ee com.eg com.et fi com.fj fm ga ge gg com.gh com.gi gl gm gr com.gt gy com.hk hn hr ht hu co.id ie co.il im co.in iq is je com.jm jo co.jp co.ke com.kh ki kg co.kr com.kw kz la com.lb li lk co.ls lt lu lv com.ly co.ma md me mg mk ml com.mm mn com.mt mu mv mw com.mx com.my co.mz com.na com.ng com.ni ne nl no com.np nr nu co.nz com.om com.pa com.pe com.pg com.ph com.pk pl pn com.pr ps com.py com.qa ro ru rw com.sa com.sb sc se com.sg sh si sk com.sl sn so sm sr st com.sv td tg co.th com.tj tl tm tn to com.tr tt com.tw co.tz com.ua co.ug com.uy co.uz com.vc co.ve co.vi com.vn vu ws rs co.za co.zm co.zw cat com.ai vg ms tk gp com.nf us net org eu dev in hk jp ac ng com.iq com.tn co.je'), ...cc('youtube', 'de com.br ru co fr be'), 'youtube-nocookie.com', 'google.github.io'] },
    { name: 'Amazon', keywords: ['amazon', 'primevideo', 'audible'], domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.com.au', 'amazon.co.jp', 'amazon.in', 'amazon.com.br', 'amazon.com.mx', 'amazon.nl', 'amazon.se', 'amazon.pl', 'amazonaws.com', 'aws.amazon.com', 'primevideo.com', 'audible.com', 'a2z.com', 'amazon.jobs', 'media-amazon.com', 'ssl-images-amazon.com', 'amazonpay.com', 'amazon.dev', 'awsstatic.com', 'cloudfront.net', 'amazontrust.com', 'images-amazon.com', ...cc('amazon', 'ae sa eg com.tr sg ie co.za cn eu com.be jp at work science'), ...cc('audible', 'co.uk de fr it es ca com.au co.jp in com.br'), 'amazon-adsystem.com', 'payments-amazon.com', 'assoc-amazon.com', 'amazon-dss.com', 'amazon-ads-attestation.com', 'amazon-corp.com'] },
    { name: 'Facebook / Meta', keywords: ['facebook', 'instagram', 'whatsapp', 'messenger', 'metamail'], domains: ['facebook.com', 'fb.com', 'fb.me', 'instagram.com', 'whatsapp.com', 'whatsapp.net', 'messenger.com', 'meta.com', 'fbcdn.net', 'cdninstagram.com', 'facebook.net', 'oculus.com', 'threads.net', 'workplace.com', 'facebook.de', 'facebook.com.br', 'facebook.fr', 'facebook.pl', 'instagram.com.br', 'instagram.de', 'instagr.am'] },
    { name: 'X / Twitter', keywords: ['twitter'], domains: ['twitter.com', 'x.com', 't.co', 'twimg.com', 'ads-twitter.com'] },
    { name: 'LinkedIn', keywords: ['linkedin'], domains: ['linkedin.com', 'licdn.com', 'lnkd.in', 'linkedin.cn'] },
    { name: 'Netflix', keywords: ['netflix'], domains: ['netflix.com', 'nflxext.com', 'nflximg.net', 'nflxvideo.net', 'netflix.net'] },
    { name: 'Spotify', keywords: ['spotify'], domains: ['spotify.com', 'scdn.co', 'spotifycdn.com', 'spotify.dev', 'spotify.net', 'spotify.link'] },
    { name: 'Disney+', keywords: ['disneyplus'], domains: ['disneyplus.com', 'disney.com', 'disney.co.uk', 'disney.pt', 'bamgrid.com', 'disney-plus.net'] },
    { name: 'Dropbox', keywords: ['dropbox'], domains: ['dropbox.com', 'dropboxusercontent.com', 'db.tt', 'dropboxstatic.com', 'dropbox.tech', 'dropbox-dns.com'] },
    { name: 'WeTransfer', keywords: ['wetransfer'], domains: ['wetransfer.com', 'we.tl', 'wetransfer.net'] },
    { name: 'DocuSign', keywords: ['docusign'], domains: ['docusign.com', 'docusign.net'] },
    { name: 'Adobe', keywords: ['adobe', 'acrobat'], domains: ['adobe.com', 'adobelogin.com', 'acrobat.com', 'adobe.io', 'typekit.net', 'adobesign.com', 'adobe.net', 'adobe.co.jp', 'adobe.ly', 'adobe.de', 'adobe-identity.com', 'adobe-campaign.com', 'adobe-addons.com'] },
    { name: 'Zoom', keywords: ['zoom'], domains: ['zoom.us', 'zoom.com', 'zoomgov.com', 'zoom.com.br', 'zoom.com.cn', 'zoom.co.jp'] },
    { name: 'Slack', keywords: ['slack'], domains: ['slack.com', 'slack-edge.com', 'slack.dev', 'slack.engineering', 'slack-imgs.com', 'slack-redir.net', 'slack-files.com', 'slackb.com', 'slack-redir.com'] },
    { name: 'Discord', keywords: ['discord', 'discordapp', 'dicord', 'nitro'], domains: ['discord.com', 'discord.gg', 'discordapp.com', 'discordapp.net', 'discord.gift', 'discord.new', 'discord.media', 'discord.me'] },
    { name: 'Telegram', keywords: ['telegram'], domains: ['telegram.org', 't.me', 'telegram.me', 'telegram.dog', 'telesco.pe', 'telegra.ph'] },
    { name: 'Steam', keywords: ['steam', 'steamcommunity', 'steampowered'], domains: ['steampowered.com', 'steamcommunity.com', 'steamgames.com', 'steamstatic.com', 'valvesoftware.com', 'steam-chat.com', 'steamcontent.com', 'steamusercontent.com', 'steam.tv'] },
    { name: 'Roblox', keywords: ['roblox', 'robux'], domains: ['roblox.com', 'rbxcdn.com', 'roblox.net'] },
    { name: 'RuneScape', keywords: ['runescape'], fillers: ['osrs', 'oldschool', 'jagex'], domains: ['runescape.com', 'jagex.com', 'runescape.wiki'] },
    { name: 'Epic Games', keywords: ['epicgames', 'fortnite'], domains: ['epicgames.com', 'fortnite.com', 'unrealengine.com', 'epicgames.dev'] },
    { name: 'PlayStation', keywords: ['playstation'], domains: ['playstation.com', 'sony.com', 'playstation.net', 'sonyentertainmentnetwork.com', 'playstation-cloud.com'] },
    { name: 'Nintendo', keywords: ['nintendo'], domains: ['nintendo.com', 'nintendo.net', 'nintendo.co.uk', 'nintendo.pt', ...cc('nintendo', 'co.jp de be nl it fr es co.kr com.au eu ch com.hk at'), 'nintendo-europe.com'] },
    { name: 'eBay', keywords: ['ebay'], domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.es', 'ebay.it', 'ebaystatic.com', 'ebayimg.com', 'ebay.ca', 'ebay.com.au', ...cc('ebay', 'at be ie nl pl ch us com.hk com.sg com.my ph in')] },
    { name: 'Walmart', keywords: ['walmart'], domains: ['walmart.com', 'walmart.ca', 'walmartimages.com', ...cc('walmart', 'com.mx co.cr com.gt com.sv'), 'wal-mart.com'] },
    { name: 'Costco', keywords: ['costco'], domains: ['costco.com', 'costco.ca', 'costco.co.uk', ...cc('costco', 'co.jp com.mx com.tw co.kr com.au')] },
    { name: 'Target', keywords: ['targetstore'], domains: ['target.com'] },
    { name: 'Best Buy', keywords: ['bestbuy'], domains: ['bestbuy.com', 'bestbuy.ca'] },
    { name: 'AliExpress', keywords: ['aliexpress', 'alibaba'], domains: ['aliexpress.com', 'alibaba.com', 'aliexpress.us', 'alicdn.com', 'alipay.com', 'taobao.com', 'aliexpress.ru', 'aliexpress-media.com', 'alibaba-inc.com', 'alibabacloud.com'] },
    { name: 'Temu', keywords: ['temu'], domains: ['temu.com'] },
    { name: 'Shein', keywords: ['shein'], domains: ['shein.com', 'shein.co.uk', 'sheincorp.com', ...cc('shein', 'com.mx com.co tw se com.vn')] },
    { name: 'HOKA', keywords: ['hoka', 'hokaone', 'hokaoneone'], domains: ['hoka.com', 'hokaoneone.com'] },
    { name: 'Shopify', keywords: ['shopify'], domains: ['shopify.com', 'myshopify.com', 'shopifycdn.com', 'shopify.dev', 'shopify.io', 'shopify.engineering', 'shopify.co.uk', 'shopifycloud.com'] },
    { name: 'Booking.com', keywords: ['booking'], domains: ['booking.com', 'bstatic.com'] },
    { name: 'Airbnb', keywords: ['airbnb'], domains: ['airbnb.com', 'airbnb.co.uk', 'airbnb.pt', 'airbnb.es', 'airbnb.fr', 'airbnb.de', ...cc('airbnb', 'net ie at be ch nl it se no dk fi pl cz gr ru cn jp mx cl ca ae org co.in co.kr co.nz co.za co.id com.br com.au com.ar com.sg com.co com.tr com.ro com.mt com.ec com.tw com.pe gy')] },
    { name: 'Uber', keywords: ['uber', 'ubereats'], domains: ['uber.com', 'ubereats.com'] },
    { name: 'Ticketmaster', keywords: ['ticketmaster'], domains: ['ticketmaster.com', 'ticketmaster.co.uk', 'ticketmaster.pt', 'livenation.com', ...cc('ticketmaster', 'com.br ca com.mx de nl es ie com.au fr ph pe be se no dk it co.nz gr cl co sg cz eu co.za pl fi ch co.th at net')] },
    // Shipping & postal services (parcel-delivery smishing is huge)
    { name: 'USPS', keywords: ['usps'], domains: ['usps.com', 'usps.gov'] },
    { name: 'UPS', keywords: ['ups'], domains: ['ups.com', 'ups.com.cn'] },
    { name: 'FedEx', keywords: ['fedex'], domains: ['fedex.com'] },
    { name: 'DHL', keywords: ['dhl'], domains: ['dhl.com', 'dhl.de', 'dhl.co.uk', 'dhlparcel.com', 'dhlexpress.com', 'dhl.pt', 'mydhl.express.dhl', 'dhlecommerce.com', 'dhl.es'] },
    { name: 'Royal Mail', keywords: ['royalmail'], domains: ['royalmail.com', 'royalmailgroup.com'] },
    { name: 'CTT', keywords: ['ctt'], domains: ['ctt.pt'] },
    { name: 'Continente', keywords: ['cartaocontinente', 'continente'], domains: ['continente.pt', 'cartaocontinente.pt', 'sonae.pt'] },
    { name: 'Via Verde', keywords: ['viaverde'], domains: ['viaverde.pt', 'brisa.pt'] },
    { name: 'E-ZPass', keywords: ['ezpass', 'zpass'], domains: ['e-zpassiag.com', 'e-zpassgroup.org', 'e-zpassgroup.com', 'e-zpassny.com', 'ezpassnj.com', 'ezpassva.com', 'ezpassmd.com', 'ezpassde.com', 'ezpassnh.com', 'ezpassri.com', 'ezpassmaineturnpike.com'] },
    { name: 'SunPass', keywords: ['sunpass'], domains: ['sunpass.com', 'floridasturnpike.com'] },
    { name: 'Correos', keywords: ['correos'], domains: ['correos.es', 'correos.com'] },
    { name: 'Canada Post', keywords: ['canadapost'], domains: ['canadapost-postescanada.ca', 'canadapost.ca'] },
    { name: 'Australia Post', keywords: ['auspost'], domains: ['auspost.com.au'] },
    { name: 'Evri', keywords: ['evri', 'hermes'], domains: ['evri.com', 'myhermes.co.uk'] },
    { name: 'La Poste', keywords: ['laposte', 'colissimo'], domains: ['laposte.fr', 'colissimo.fr', 'laposte.net'] },
    { name: 'Deutsche Post', keywords: ['deutschepost'], domains: ['deutschepost.de'] },
    { name: 'PostNL', keywords: ['postnl'], domains: ['postnl.nl', 'postnl.be'] },
    { name: 'InPost', keywords: ['inpost'], domains: ['inpost.pl', 'inpost.eu', 'inpost-group.com', 'inpost.co.uk', 'inpost.it', 'inpost.es', 'inpost.pt'] },
    // Government / tax
    { name: 'IRS', keywords: ['irs'], domains: ['irs.gov'] },
    { name: 'HMRC', keywords: ['hmrc'], domains: ['gov.uk', 'hmrc.gov.uk', 'tax.service.gov.uk'] },
    { name: 'DVLA', keywords: ['dvla'], domains: ['gov.uk', 'dvla.gov.uk'] },
    { name: 'GOV.UK', keywords: ['govuk'], domains: ['gov.uk', 'service.gov.uk'] },
    { name: 'Autoridade Tributária', keywords: ['financas', 'portaldasfinancas', 'autoridadetributaria'], domains: ['gov.pt', 'portaldasfinancas.gov.pt', 'at.gov.pt'] },
    { name: 'Segurança Social', keywords: ['segurancasocial', 'seg-social'], domains: ['seg-social.pt', 'gov.pt'] },
    { name: 'Chave Móvel Digital', keywords: ['chavemovel', 'chavemoveldigital', 'autenticacaogov'], domains: ['autenticacao.gov.pt', 'gov.pt'] },
    { name: 'Social Security Administration', keywords: ['ssa'], domains: ['ssa.gov'] },
    { name: 'Medicare', keywords: ['medicare'], domains: ['medicare.gov', 'cms.gov'] },
    { name: 'Agencia Tributaria', keywords: ['agenciatributaria'], domains: ['agenciatributaria.gob.es', 'agenciatributaria.es'] },
    { name: 'DGT (tráfico)', keywords: ['dgt'], domains: ['dgt.es', 'dgt.gob.es'] },
    { name: 'Seguridad Social', keywords: ['segsocial', 'seguridadsocial'], domains: ['seg-social.es', 'seg-social.gob.es'] },
    { name: 'SNS 24', keywords: ['sns24'], domains: ['sns24.gov.pt', 'sns.gov.pt', 'min-saude.pt', 'gov.pt'] },
    // Telecom / utilities
    { name: 'Verizon', keywords: ['verizon'], domains: ['verizon.com', 'verizonwireless.com', 'vzw.com', 'verizon.net'] },
    { name: 'AT&T', keywords: ['att'], domains: ['att.com', 'att.net', 'app-analytics-services-att.com', 'att-idns.net', 'att-securefamily.com'] },
    { name: 'T-Mobile', keywords: ['tmobile'], domains: ['t-mobile.com', 't-mobile.pl', 'telekom.de', 't-mobile.nl', 't-mobile.cz', 'tmobile-digital.com', 'tmobile-familymode.com'] },
    { name: 'Vodafone', keywords: ['vodafone'], domains: ['vodafone.com', 'vodafone.co.uk', 'vodafone.pt', 'vodafone.de', 'vodafone.es', 'vodafone.it', ...cc('vodafone', 'com.tr cz com.au nl net.tr com.eg ua ro gr ie hu qa om al'), 'vodafonemail.de', 'vodafone-ip.de'] },
    { name: 'MEO', keywords: ['meo'], domains: ['meo.pt', 'altice.pt'] },
    { name: 'NOS', keywords: ['nos'], domains: ['nos.pt'] },
    { name: 'EDP', keywords: ['edp'], domains: ['edp.pt', 'edp.com'] },
    { name: 'Orange', keywords: ['orange'], domains: ['orange.com', 'orange.fr', 'orange.es', 'orange.pl', 'orange.ro', ...cc('orange', 'mg be sk co.il ma eg jo md ci tn cm'), 'orange-business.com'] },
    { name: 'BT', keywords: ['btinternet'], domains: ['bt.com', 'btinternet.com', 'btinternet.co.uk'] },
    { name: 'Comcast / Xfinity', keywords: ['xfinity', 'comcast'], domains: ['xfinity.com', 'comcast.com', 'comcast.net'] },
    // Misc high-value
    { name: 'Norton', keywords: ['norton', 'lifelock'], domains: ['norton.com', 'lifelock.com', 'nortonlifelock.com'] },
    { name: 'McAfee', keywords: ['mcafee'], domains: ['mcafee.com', 'mcafee.net'] },
    { name: 'Geek Squad', keywords: ['geeksquad'], domains: ['bestbuy.com', 'geeksquad.com'] },
    { name: 'Okta', keywords: ['okta'], domains: ['okta.com', 'oktacdn.com', 'okta-emea.com', 'oktapreview.com', 'okta-gov.com'] },
    { name: 'Yahoo', keywords: ['yahoo'], domains: ['yahoo.com', 'yahoo.co.jp', 'yimg.com', 'yahoo.co.uk', 'aol.com', ...cc('yahoo', 'net de com.tw fr com.br ca es'), 'yahoo.cloud', 'storage-yahoo.jp', 'yahoo-net.jp'] },
    { name: 'Proton', keywords: ['protonmail'], domains: ['proton.me', 'protonmail.com', 'protonmail.ch'] },
    { name: 'GitHub', keywords: ['github'], domains: ['github.com', 'github.io', 'githubusercontent.com', 'githubassets.com', 'github.blog', 'github.dev'] },
    { name: 'Canva', keywords: ['canva'], domains: ['canva.com', 'canva.link', 'canva.cn', 'canva.in', 'canva-apps.com', 'canva.site', 'canva-apps.cn'] },
    { name: 'OLX', keywords: ['olx'], domains: ['olx.pt', 'olx.com', 'olx.pl', 'olx.ro', 'olx.ua', 'olx.com.br', 'olx.in', 'olxstatic.com', ...cc('olx', 'com.pk co.id kz uz bg ba com.lb com.eg'), 'olx-st.com'] },
    { name: 'Vinted', keywords: ['vinted'], domains: ['vinted.com', 'vinted.pt', 'vinted.fr', 'vinted.co.uk', 'vinted.de', 'vinted.es', 'vinted.it', 'vinted.nl', 'vinted.pl', 'vinted.lt', ...cc('vinted', 'net be cz hu ie com.au at dk ro se lu fi sk gr si hr lv ee bg')] },
    { name: 'Poshmark', keywords: ['poshmark'], domains: ['poshmark.com', 'poshmark.ca', 'posh.mk'] },
    { name: 'Wallapop', keywords: ['wallapop'], domains: ['wallapop.com'] },
    { name: 'Leboncoin', keywords: ['leboncoin'], domains: ['leboncoin.fr'] },
    { name: 'Marktplaats', keywords: ['marktplaats'], domains: ['marktplaats.nl', 'marktplaats.com'] },
    { name: 'Gumtree', keywords: ['gumtree'], domains: ['gumtree.com', 'gumtree.com.au', 'gumtree.co.za'] },
    { name: 'Craigslist', keywords: ['craigslist'], domains: ['craigslist.org'] },
    { name: 'Kleinanzeigen', keywords: ['kleinanzeigen'], domains: ['kleinanzeigen.de', 'ebay-kleinanzeigen.de'] },
    { name: 'Subito', keywords: ['subito'], domains: ['subito.it'] },
    { name: 'Milanuncios', keywords: ['milanuncios'], domains: ['milanuncios.com'] },
    { name: 'CustoJusto', keywords: ['custojusto'], domains: ['custojusto.pt'] },
    { name: 'Idealista', keywords: ['idealista'], domains: ['idealista.com', 'idealista.pt', 'idealista.it', 'idealista.fr'] },
    { name: 'Mercado Libre', keywords: ['mercadolibre', 'mercadolivre', 'mercadopago'], domains: ['mercadolibre.com', 'mercadolibre.com.ar', 'mercadolibre.com.mx', 'mercadolivre.com.br', 'mercadopago.com', 'mercadopago.com.br', 'mlstatic.com', 'mercadolivre.com', ...cc('mercadolibre', 'cl com.co com.ve com.uy com.pe com.ec com.do co.cr com.hn com.bo com.pa'), ...cc('mercadopago', 'com.ar com.mx com.co cl com.pe com.uy'), 'meli.com'] },
    { name: 'Depop', keywords: ['depop'], domains: ['depop.com'] },
    { name: 'Etsy', keywords: ['etsy'], domains: ['etsy.com', 'etsystatic.com', 'etsy.me'] },
    { name: 'Shpock', keywords: ['shpock'], domains: ['shpock.com'] },
    { name: 'Kijiji', keywords: ['kijiji'], domains: ['kijiji.ca'] },
    { name: 'Mobile.de', keywords: ['mobile-de'], domains: ['mobile.de'] },
    { name: 'AutoScout24', keywords: ['autoscout24', 'autoscout'], domains: ['autoscout24.com', 'autoscout24.de', 'autoscout24.pt', 'autoscout24.es', 'autoscout24.fr', 'autoscout24.it', ...cc('autoscout24', 'be ch net nl at ro hr pl hu ru cz bg com.tr')] },
    { name: 'Bizum', keywords: ['bizum'], domains: ['bizum.es'] },
    { name: 'Lydia', keywords: ['lydia'], domains: ['lydia-app.com'] },
    { name: 'Western Union', keywords: ['westernunion'], domains: ['westernunion.com'] },
    { name: 'MoneyGram', keywords: ['moneygram'], domains: ['moneygram.com'] },
    // Added from PhishTank most-targeted brands (2026-11 review)
    { name: 'Allegro', keywords: ['allegro', 'allegrolokalnie'], domains: ['allegro.pl', 'allegrolokalnie.pl', 'allegro.cz', 'allegro.sk', 'allegro.hu', 'allegroimg.com', 'allegrostatic.com', 'allegro.com'] },
    { name: 'Bradesco', keywords: ['bradesco'], domains: ['bradesco.com.br', 'bradesco.com', 'bradescoseguros.com.br', 'next.me', 'bradescopj.com.br'] },
    { name: 'Banco do Brasil', keywords: ['bancodobrasil'], domains: ['bb.com.br', 'bancodobrasil.com.br', 'bancobrasil.com.br'] },
    { name: 'Itaú', keywords: ['itau'], domains: ['itau.com.br', 'itau.com', 'itaucard.com.br', 'itau.com.py', 'itau.com.uy'] },
    { name: 'Nubank', keywords: ['nubank'], domains: ['nubank.com.br', 'nu.com.br', 'nubank.com.mx'] },
    { name: 'Optus', keywords: ['optus'], domains: ['optus.com.au', 'optusnet.com.au', 'optus.net.au'] },
    { name: 'Société Générale', keywords: ['societegenerale'], domains: ['societegenerale.fr', 'societegenerale.com', 'particuliers.societegenerale.fr'] },
    { name: 'La Banque Postale', keywords: ['labanquepostale', 'banquepostale'], domains: ['labanquepostale.fr', 'labanquepostale.com'] },
    { name: 'Crédit Agricole', keywords: ['creditagricole', 'credit-agricole'], domains: ['credit-agricole.fr', 'credit-agricole.com', 'ca-cb.com', 'credit-agricole.pl', 'credit-agricole.it'] },
    { name: 'BNP Paribas', keywords: ['bnpparibas'], domains: ['bnpparibas.com', 'bnpparibas.net', 'mabanque.bnpparibas', 'bnpparibas.de', 'bnpparibas.pl', 'bnpparibas.fr'] },
    { name: 'Free Mobile', keywords: ['freemobile', 'free-mobile'], domains: ['free.fr', 'free-mobile.fr', 'mobile.free.fr'] },
    { name: 'Ameli (Assurance Maladie)', keywords: ['ameli'], domains: ['ameli.fr', 'assurance-maladie.ameli.fr'] },
    { name: 'impots.gouv.fr', keywords: ['impots', 'impotsgouv'], domains: ['impots.gouv.fr', 'gouv.fr'] },
    { name: 'ANTAI (amendes)', keywords: ['antai', 'amendes'], domains: ['antai.gouv.fr', 'amendes.gouv.fr', 'gouv.fr'] },
    { name: 'SMBC', keywords: ['smbc'], domains: ['smbc.co.jp', 'smbc-card.com', 'smbcgroup.com'] },
    { name: 'Interactive Brokers', keywords: ['interactivebrokers', 'ibkr'], domains: ['interactivebrokers.com', 'ibkr.com', 'interactivebrokers.co.uk', 'interactivebrokers.ie', 'interactivebrokers.co.in', 'interactivebrokers.com.hk', 'interactivebrokers.com.au', 'interactivebrokers.com.sg'] },
    { name: 'ABN AMRO', keywords: ['abnamro'], domains: ['abnamro.nl', 'abnamro.com'] },
    { name: 'Rabobank', keywords: ['rabobank'], domains: ['rabobank.nl', 'rabobank.com', 'rabobank.com.au'] },
    { name: 'DBS', keywords: ['dbsbank', 'posb'], domains: ['dbs.com.sg', 'dbs.com', 'posb.com.sg'] },
    { name: 'Scotiabank', keywords: ['scotiabank', 'scotia'], domains: ['scotiabank.com', 'scotiabank.ca', 'scotiaonline.scotiabank.com', 'scotiabank.cl', 'scotiabank.com.pe', 'scotiabank.com.mx', 'scotiabank.com.uy'] },
    { name: 'Raiffeisen', keywords: ['raiffeisen'], domains: ['raiffeisen.at', 'raiffeisen.ch', 'raiffeisen.ru', 'rbinternational.com', 'raiffeisenbank.cz', 'raiffeisen.hu', 'raiffeisen.ro', 'raiffeisen.rs', 'raiffeisen.ba', 'raiffeisen.ua', 'volksbank.de', 'vr.de'] },
    { name: 'Swiss Post', keywords: ['swisspost', 'postfinance'], domains: ['post.ch', 'postfinance.ch'] },
    { name: 'Intesa Sanpaolo', keywords: ['intesasanpaolo', 'intesa'], domains: ['intesasanpaolo.com', 'intesasanpaolo.it'] },
    { name: 'UniCredit', keywords: ['unicredit'], domains: ['unicredit.it', 'unicredit.eu', 'unicreditgroup.eu'] },
    { name: 'Poste Italiane', keywords: ['posteitaliane', 'postepay'], domains: ['poste.it', 'postepay.it', 'posteitaliane.it'] },
    { name: 'ABSA', keywords: ['absa'], domains: ['absa.co.za', 'absa.africa'] },
    { name: 'Huntington', keywords: ['huntington'], domains: ['huntington.com'] },
    { name: 'AEON', keywords: ['aeon'], domains: ['aeon.co.jp', 'aeoncard.co.jp', 'aeon.com', 'aeon.jp'] },
    { name: 'Sparkasse', keywords: ['sparkasse'], domains: ['sparkasse.de', 'sparkasse.at'] },
    { name: 'Commerzbank', keywords: ['commerzbank'], domains: ['commerzbank.de', 'commerzbank.com'] },
    { name: 'Postbank', keywords: ['postbank'], domains: ['postbank.de'] },
    { name: 'DKB', keywords: ['dkb'], domains: ['dkb.de'] },
    { name: 'Hermes (DE)', keywords: ['myhermes'], domains: ['myhermes.de'] },
    { name: 'PKO BP', keywords: ['pkobp', 'ipko', 'pkobiznes'], domains: ['pkobp.pl', 'ipko.pl', 'ipkobiznes.pl', 'pkopte.pl', 'pkofaktoring.pl'] },
    // Gulf parcel and shopping smishing (Khaleej Times, Nov 2026): fake customs fees, fake deals
    { name: 'Aramex', keywords: ['aramex'], domains: ['aramex.com', 'aramex.ae'] },
    { name: 'Emirates Post', keywords: ['emiratespost'], domains: ['emiratespost.ae', 'emiratespostshop.ae', 'epg.gov.ae'] },
    { name: 'Noon', keywords: ['noon'], domains: ['noon.com', 'nooncdn.com', 'noon.partners'] },
    // Portugal: IMT impersonated after its November 2026 cyberattack
    { name: 'IMT', keywords: ['imt', 'imtonline'], domains: ['imt-ip.pt', 'imtonline.pt'] },
    // Portugal: retail and classifieds brands used in fake-shop and fake-ad scams
    { name: 'Worten', keywords: ['worten'], domains: ['worten.pt', 'worten.es'] },
    { name: 'Pingo Doce', keywords: ['pingodoce'], domains: ['pingodoce.pt', 'jeronimomartins.com', 'jeronimomartins.pt'] },
    { name: 'Imovirtual', keywords: ['imovirtual'], domains: ['imovirtual.com', 'imovirtual.pt'] },
    { name: 'Standvirtual', keywords: ['standvirtual'], domains: ['standvirtual.com', 'standvirtual.pt'] },
    // Black Friday 2026 fake-shop networks (NordVPN: 10,000 stores copying 166 fashion brands;
    // CloudSEK: 4,660 domains, Aldi 659 and Lidl/Parkside 156). Country sites from the Tranco list.
    { name: 'Adidas', keywords: ['adidas'], domains: [...cc('adidas', 'com co.uk de com.br fr es jp it pl co ca com.ar co.id cl mx com.tr pe co.in co.za gr pt nl com.au com.hk com.ph co.il at co.kr no com.eg com.tw cz hr com.sg co.ma dk sa ie ae com.cn com.my com.vn fi ch co.th ua se be sk co.nz ro kz ru'), 'adidas-group.com'] },
    { name: 'Ralph Lauren', keywords: ['ralphlauren'], domains: cc('ralphlauren', 'com co.uk co.jp global eu de com.sg fr ca com.au it es com.tw co.kr nl be com.my') },
    { name: 'Dr. Martens', keywords: ['drmartens'], domains: ['drmartens.com', 'drmartensplc.com'] },
    { name: 'Crocs', keywords: ['crocs'], domains: cc('crocs', 'com in com.br com.mx co.uk co.jp com.ar ca fr com.au co.id com.tr de eu') },
    { name: 'Massimo Dutti', keywords: ['massimodutti'], domains: ['massimodutti.com', 'massimodutti.net', 'massimodutti.cn', 'inditex.com'] },
    { name: 'Michael Kors', keywords: ['michaelkors'], domains: cc('michaelkors', 'com eu global it co.uk fr de') },
    { name: 'Aldi', keywords: ['aldi', 'aldisued', 'aldinord'], domains: [...cc('aldi', 'com us co.uk es nl com.au fr be hu pl it de ie pt ch'), 'aldi-sued.de', 'aldi-sued.com', 'aldi-nord.de', 'hofer.at'] },
    { name: 'Lidl', keywords: ['lidl'], domains: cc('lidl', 'com de es fr it cz pl co.uk nl be ro sk pt se hr hu bg rs ie ch at fi si com.cy dk gr lt lv ee us') },
    // Germany (Verbraucherzentrale phishing radar, Nov 2026)
    { name: 'Deutsche Rentenversicherung', keywords: ['rentenversicherung'], domains: ['deutsche-rentenversicherung.de', 'eservice-drv.de'] },
  ];

  // Keywords this short or this generic only count when they are a whole
  // hostname label, never when they are merely embedded inside one.
  const WHOLE_LABEL_ONLY = new Set(['ups', 'att', 'irs', 'ssa', 'meo', 'nos', 'edp', 'ctt', 'cgd', 'bpi', 'dhl', 'ing', 'amex', 'visa', 'zoom', 'slack', 'okta', 'olx', 'n26', 'apple', 'chase', 'ledger', 'phantom', 'orange', 'target', 'booking', 'steam', 'blockchain', 'millennium', 'hermes', 'nitro', 'evri', 'uber', 'temu', 'bofa', 'kraken', 'canva', 'wise', 'lloyds', 'halifax', 'stripe', 'klarna', 'norton', 'twitter', 'hmrc', 'dvla', 'medicare', 'telegram', 'spotify', 'adobe', 'google', 'subito', 'lydia', 'depop', 'etsy', 'intesa', 'scotia', 'absa', 'aeon', 'dkb', 'posb', 'noon', 'imt', 'aldi', 'ameli', 'impots', 'amendes', 'smbc', 'huntington', 'optus', 'continente', 'hoka', 'ezpass', 'zpass', 'dgt', 'inpost', 'ipko']);

  // Keywords whose spelling sits one or two letters from unrelated real names
  // (An Post / InPost, Enpass / E-ZPass, UN ESCAP / RuneScape, WebMoney's
  // wmtransfer / WeTransfer): maximum typo distance, 0 = no typo matching.
  const TYPO_MAX = { imtonline: 0, imovirtual: 1, inpost: 0, ezpass: 0, zpass: 0, segsocial: 0, wetransfer: 0, runescape: 1 };

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
    // Seen glued to brand names in 2026 phishing feeds (amazoncheckout, trezorvault, sunpasstollsbill, costcomember)
    'checkout', 'purchase', 'vault', 'suite', 'member', 'mailer', 'toll', 'tolls', 'bill', 'bills', 'fine', 'fines', 'penalty',
    // Fake-shop names for Black Friday 2026 ("brand-blackfriday.shop", "adidasoutlet")
    'blackfriday', 'cybermonday', 'outlet', 'sale', 'sales', 'discount', 'deals',
  ];

  // Words that ask the visitor to do something. When two or more words are glued
  // to a brand name, one of them must be an action word: "paypalloginverify" is a
  // phishing name, "amazonwebservices" and "mcafeemobilesecurity" are the brands' own.
  const ACTION_TOKENS = [
    'login', 'signin', 'logon', 'verify', 'verification', 'verified', 'account', 'accounts', 'update', 'updates', 'auth',
    'authentication', 'confirm', 'confirmation', 'billing', 'payment', 'payments', 'pay', 'wallet', 'recovery', 'recover', 'reset',
    'unlock', 'locked', 'suspended', 'alert', 'alerts', 'notice', 'notification', 'session', 'validate', 'validation', 'appeal',
    'case', 'refund', 'refunds', 'invoice', 'delivery', 'parcel', 'package', 'tracking', 'track', 'redelivery', 'reschedule',
    'shipment', 'gift', 'giveaway', 'bonus', 'reward', 'rewards', 'prize', 'claim', 'airdrop', 'mint', 'connect', 'sync', 'kyc',
    'limited', 'restricted', 'hold', 'unusual', 'activity', 'helpdesk', 'support', 'help', 'checkout', 'purchase', 'toll', 'tolls',
    'bill', 'bills', 'fine', 'fines', 'penalty',
  ];

  // Popular sites whose name merely equals a brand keyword: a Dutch broadcaster
  // (nos.nl), the fashion house Hermes, a US newspaper (telegram.com), a city
  // (halifax.ca). They are not impersonations; checked against the Tranco top list.
  const UNRELATED_DOMAINS = new Set([
    'nos.nl', 'hermes.com', 'telegram.com', 'zoom.earth', 'kraken.io', 'aeon.co', 'halifax.ca', 'uber.space', 'huntington.org',
    'att.ne.jp', 'ups.edu.ec', 'impots.bj', 'ctt.ec', 'correos.cl', 'att.com.mx', 'blockchain.news', 'telegram.hr',
    // One or two letters from a brand name, found by tools/top-sites-sweep.js (Tranco top 50k)
    'elle.com', 'elle.fr', 'elle.de', 'zello.com', 'stern.de', 'stream.cz', 'stream.ru', 'stream.ne.jp', 'stem.org.uk', 'lexpress.fr',
    'allenpress.com', 'lacoste.com', 'felissimo.co.jp', 'optum.com', 'opus.pro', 'continental.com', 'klara.com', 'idealist.org',
    'minted.com', 'medex.com.bd', 'ludia.net', 'lithub.com', 'tbank.ru', 'exitgames.com', 'pcgames.de', 'fitauto.ru', 'bitauto.com',
    'gbooking.ru', 'paypay.ne.jp', 'finance.ua', 'finance.si', 'star-telegram.com', 'telegraf.rs', 'telegraf.com.ua', 'ymobile.jp',
    'intercom-messenger.com', 'idrive.com', 'hicloud.com', 'saicloud.com', 'stripes.com', 'stripo.email', 'correios.com.br',
    'grail.bz', 'vficloud.net', 'bkicloud.com', 'jsonline.com', 'chargepoint.com', 'deutschebahn.com', 'autosport.com', 'blockchair.com',
    'mollygram.com', 'smbc-comics.com', 'imt-atlantique.fr', 'whats-on-netflix.com', 'nedbank.co.za', 'commercebank.com', 'dfinity.network', 'royalark.games', 'combway.com', 'mobile-bb.com',
  ]);

  const byDomain = new Map();
  for (const b of BRANDS) for (const d of b.domains) byDomain.set(d, b);

  // Closed ".brand" top-level domains: only the brand itself can register
  // names under them (cloud.microsoft, about.google, ...).
  const BRAND_TLDS = {
    microsoft: 'Microsoft', office: 'Microsoft', windows: 'Microsoft', xbox: 'Microsoft', bing: 'Microsoft', azure: 'Microsoft', skype: 'Microsoft',
    google: 'Google', youtube: 'Google', gmail: 'Google', android: 'Google', chrome: 'Google',
    apple: 'Apple', amazon: 'Amazon', aws: 'Amazon', netflix: 'Netflix', barclays: 'Barclays', hsbc: 'HSBC', citi: 'Citi',
    americanexpress: 'American Express', amex: 'American Express', bnpparibas: 'BNP Paribas', santander: 'Santander', bbva: 'BBVA',
    dhl: 'DHL', fedex: 'FedEx', ups: 'UPS', ebay: 'eBay', walmart: 'Walmart', bradesco: 'Bradesco',
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

  return { BRANDS, UNRELATED_DOMAINS, WHOLE_LABEL_ONLY, TYPO_MAX, SUSPICIOUS_TOKENS, ACTION_TOKENS, BRAND_TLDS, findByDomain };
});
