const fs = require('fs');

let html = fs.readFileSync('sample-code/product-page/new-design.html', 'utf8');

let traditionMatch = html.match(/<!-- Tradition -->\s*<section class="tradition">([\s\S]*?)<\/section>/);
if (traditionMatch) {
    let tradition = `<!-- Tradition -->\n<section class="nx-pdp-tradition">` + traditionMatch[1] + `</section>`;
    tradition = tradition.replace('<div>', '<div class="nx-pdp-tradition__content">');
    tradition = tradition.replace('<h2>', '<h2 class="nx-pdp-tradition__title">');
    tradition = tradition.replace('<p class="lead">', '<p class="nx-pdp-tradition__lead">');
    tradition = tradition.replace('<div class="horse-card">', '<div class="nx-pdp-tradition__horse-card">');
    tradition = tradition.replace('<h3>', '<h3 class="nx-pdp-tradition__horse-title">');
    tradition = tradition.replace('<p>', '<p class="nx-pdp-tradition__horse-text">');
    tradition = tradition.replace('<img class="carrot"', '<img class="nx-pdp-tradition__carrot"');
    tradition = tradition.replace('<div class="composite">', '<div class="nx-pdp-tradition__composite">');
    tradition = tradition.replace('<img src=', '<img class="nx-pdp-tradition__composite-img" src=');
    fs.writeFileSync('templates/components/custom/nexyl/product/tradition.html', tradition);
}

let bannersMatch = html.match(/<!-- Banners -->\s*<section class="banners">([\s\S]*?)<\/section>/);
if (bannersMatch) {
    let banners = `<!-- Banners -->\n<section class="nx-pdp-banners">` + bannersMatch[1] + `</section>`;
    banners = banners.replace('<div class="bcard a">', '<div class="nx-pdp-banners__card nx-pdp-banners__card--a">');
    banners = banners.replace('<div class="bcard b">', '<div class="nx-pdp-banners__card nx-pdp-banners__card--b">');
    banners = banners.replace(/<div class="pad">/g, '<div class="nx-pdp-banners__pad">');
    banners = banners.replace(/<h2>/g, '<h2 class="nx-pdp-banners__title">');
    banners = banners.replace(/<p>/g, '<p class="nx-pdp-banners__text">');
    banners = banners.replace('<img class="hand"', '<img class="nx-pdp-banners__hand"');
    banners = banners.replace('<div class="step-pills">', '<div class="nx-pdp-banners__step-pills">');
    banners = banners.replace(/<div class="step-pill">/g, '<div class="nx-pdp-banners__step-pill">');
    banners = banners.replace('<svg class="swoosh"', '<svg class="nx-pdp-banners__swoosh"');
    banners = banners.replace('<div class="sandwiches">', '<div class="nx-pdp-banners__sandwiches">');
    banners = banners.replace(/<img src=/g, '<img class="nx-pdp-banners__sandwich-img" src=');
    fs.writeFileSync('templates/components/custom/nexyl/product/banners.html', banners);
}
