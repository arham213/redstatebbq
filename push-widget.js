const https = require('https');

// --- MERCHANTS: REPLACE THESE WITH YOUR API CREDENTIALS ---
const STORE_HASH = 'a00ekum4a8';
const ACCESS_TOKEN = 'sacjm4kexbe6nq3z3igfksjo3dqplid';
// ----------------------------------------------------------

const widgetTemplate = {
  name: 'Product Info Accordion',
  template: `
<div class="nx-widget-accordion">
    {{#if description}}
    <div class="nx-pdp-acc-item">
        <div class="nx-pdp-acc-trigger">
            <span class="nx-pdp-acc-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d0d0e" stroke-width="2">
                    <path class="nx-pdp-plus-path" d="M12 5v14M5 12h14" />
                    <path class="nx-pdp-minus-path" d="M5 12h14" style="display:none;" />
                </svg>
            </span>
            <span class="nx-pdp-acc-title">Description</span>
        </div>
        <div class="nx-pdp-acc-content">
            {{{description}}}
        </div>
    </div>
    {{/if}}

    {{#if nutritional_value}}
    <div class="nx-pdp-acc-item">
        <div class="nx-pdp-acc-trigger">
            <span class="nx-pdp-acc-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d0d0e" stroke-width="2">
                    <path class="nx-pdp-plus-path" d="M12 5v14M5 12h14" />
                    <path class="nx-pdp-minus-path" d="M5 12h14" style="display:none;" />
                </svg>
            </span>
            <span class="nx-pdp-acc-title">Nutritional Value</span>
        </div>
        <div class="nx-pdp-acc-content">
            {{{nutritional_value}}}
        </div>
    </div>
    {{/if}}

    {{#if ingredients}}
    <div class="nx-pdp-acc-item">
        <div class="nx-pdp-acc-trigger">
            <span class="nx-pdp-acc-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d0d0e" stroke-width="2">
                    <path class="nx-pdp-plus-path" d="M12 5v14M5 12h14" />
                    <path class="nx-pdp-minus-path" d="M5 12h14" style="display:none;" />
                </svg>
            </span>
            <span class="nx-pdp-acc-title">Ingredients</span>
        </div>
        <div class="nx-pdp-acc-content">
            {{{ingredients}}}
        </div>
    </div>
    {{/if}}
</div>
  `,
  schema: [
    {
      type: 'tab',
      label: 'Content',
      sections: [
        {
          label: 'Description',
          settings: [
            {
              type: 'code',
              label: 'Description HTML',
              id: 'description',
              default: '',
              typeMeta: {
                language: 'html'
              }
            }
          ]
        },
        {
          label: 'Nutritional Value',
          settings: [
            {
              type: 'code',
              label: 'Nutritional Value HTML',
              id: 'nutritional_value',
              default: '',
              typeMeta: {
                language: 'html'
              }
            }
          ]
        },
        {
          label: 'Ingredients',
          settings: [
            {
              type: 'code',
              label: 'Ingredients HTML',
              id: 'ingredients',
              default: '',
              typeMeta: {
                language: 'html'
              }
            }
          ]
        }
      ]
    }
  ]
};

const data = JSON.stringify(widgetTemplate);

const options = {
  hostname: 'api.bigcommerce.com',
  path: `/stores/${STORE_HASH}/v3/content/widget-templates`,
  method: 'POST',
  headers: {
    'X-Auth-Token': ACCESS_TOKEN,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Success! The new Fully Functional Custom Widget has been added to your Page Builder!');
    } else {
      console.error('❌ Failed to push widget.');
      console.error(body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error: ', e);
});

req.write(data);
req.end();
