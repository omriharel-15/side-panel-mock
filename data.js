/* =====================================================================
   Data — journey graph, panel field models, and content libraries.
   Pure data, no rendering/interaction logic. Loaded before app.js.
   ===================================================================== */

/* ---------- icons ---------- */
const I = {
  person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  eyeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  clone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>',
  docs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 12-1.4-1.4L16 13.2V4h-2v9.2l-2.6-2.6L10 12l4 4Z"/></svg>',
  dot:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="7"/></svg>',
  code:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  chevUp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 15 6-6 6 6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  ret:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>',
  passkey:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 11a4 4 0 1 0-4-4"/><path d="M12 11v10"/><path d="M12 15h4"/><path d="M2 21a10 10 0 0 1 10-10"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9z"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9"/></svg>',
  flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M6 8.5V12h12V8.5M12 12v3.5"/></svg>',
  keyuser:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="8" r="3.5"/><path d="M3 20a7 7 0 0 1 14 0M16 8h6M19 8v3"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></svg>',
  idcard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M15 9h4M15 13h4"/></svg>',
  usercog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="18" cy="8" r="2.4"/><path d="M18 4.5V6M18 10v1.5M21 8h-1.5M16.5 8H15"/></svg>',
  session:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M8 9l2.5 2.5L15 7"/></svg>',
  db:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5V18.5c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8V5.5"/><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/></svg>',
  connect:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3v4a2 2 0 0 1-2 2H3M15 21v-4a2 2 0 0 1 2-2h4M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4"/></svg>',
  sparkle:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2c.4 3.2 1 4.8 2.1 5.9C14.2 9 15.8 9.6 19 10c-3.2.4-4.8 1-5.9 2.1C11.9 13.2 11.3 14.8 11 18c-.4-3.2-1-4.8-2.1-5.9C7.8 11 6.2 10.4 3 10c3.2-.4 4.8-1 5.9-2.1C10 6.8 10.6 5.2 11 2Z"/><path d="M19 13.5c.2 1.3.5 2 1 2.5.5.5 1.2.8 2.5 1-1.3.2-2 .5-2.5 1-.5.5-.8 1.2-1 2.5-.2-1.3-.5-2-1-2.5-.5-.5-1.2-.8-2.5-1 1.3-.2 2-.5 2.5-1 .5-.5.8-1.2 1-2.5Z"/></svg>',
  arrowRight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

/* ---------- categories: prod step-icons.service (cyan user / mustard server) ---------- */
const CAT = {
  user:   { color:'var(--user-cyan)',      icon:I.person, label:'User interaction step' },
  server: { color:'var(--server-mustard)', icon:I.card,   label:'System execution step' },
};

/* =====================================================================
   Journey — HE Passkey Login (real export)
   ===================================================================== */
const NODES = {
  'get-info': {
    id:'get-info', title:'Get information from client', cat:'user', userFacing:true,
    desc:'Requests info from the client app (such as user input collected using a form).',
    x:170, y:340, branches:[{id:'default', label:'Default', type:'plain'}],
  },
  'login-form': {
    id:'login-form', title:'Login form', cat:'user', userFacing:true,
    desc:'Present one or more authentication options to the client app. Enabling an authentication…',
    x:480, y:340, branches:[{id:'password', label:'Password', type:'plain'},{id:'passkeys', label:'Passkeys', type:'plain'}],
  },
  'password-auth': {
    id:'password-auth', title:'Password authentication', cat:'server', userFacing:true,
    desc:'Authenticate with password and sets the user context of this journey to the authenticated…',
    x:810, y:160, branches:[{id:'failure', label:'Failure', type:'failure'},{id:'success', label:'Success', type:'success'}],
  },
  'passkeys-auth': {
    id:'passkeys-auth', title:'Passkeys authentication', cat:'user', userFacing:true,
    desc:'Authenticate with passkeys and sets the user context of this journey to the authenticated…',
    x:810, y:460, branches:[{id:'failure', label:'Failure', type:'failure'},{id:'success', label:'Success', type:'success'}],
  },
  'known-device': {
    id:'known-device', title:'Is known device', cat:'server', userFacing:false,
    desc:'Check if the current device is already registered using the Crypto binding technol…',
    x:1140, y:410, branches:[{id:'yes', label:'Yes', type:'success'},{id:'no', label:'No', type:'failure'}],
  },
  'email-validation': {
    id:'email-validation', title:'Email validation', cat:'user', userFacing:true,
    desc:'Validate provided email through a one-time passcode.',
    x:1450, y:410, branches:[{id:'failure', label:'Failure', type:'failure'},{id:'success', label:'Success', type:'success'},{id:'branch_1', label:'branch 1', type:'plain'}],
  },
  'send-sms': {
    id:'send-sms', title:'Send SMS', cat:'server', userFacing:false,
    desc:'Send an SMS message to a recipient.',
    x:1790, y:410, branches:[{id:'default', label:'Default', type:'plain'}],
  },
  'create-user': {
    id:'create-user', title:'Create User', cat:'server', userFacing:false,
    desc:'Creates a new user record from the identifiers collected earlier in the journey.',
    x:2130, y:410, branches:[{id:'default', label:'Default', type:'plain'}],
  },
};

const PILLS = [
  { id:'goto-login', kind:'goto', label:'Login form', x:1170, y:200 },
  { id:'complete', kind:'complete', label:'Complete Journ…', sub:'Flag this Journey as successfully co…', x:2470, y:340 },
];

/* email-validation's 'failure' and 'branch_1' branches are deliberately left
   unwired here — they demonstrate the "unfinished branch" state that
   allErrors() now blocks Save/Publish on, and that you can wire up yourself
   by dragging from their ports (or the dynamic "+" next to them) onto any
   node or the Complete pill. */
const EDGES = [
  { from:['start'], to:'get-info' },
  { from:['get-info','default'], to:'login-form' },
  { from:['login-form','password'], to:'password-auth' },
  { from:['login-form','passkeys'], to:'passkeys-auth' },
  { from:['password-auth','success'], to:'known-device' },
  { from:['passkeys-auth','success'], to:'known-device' },
  { from:['known-device','yes'], to:'email-validation' },
  { from:['known-device','no'], to:'email-validation' },
  { from:['email-validation','success'], to:'send-sms' },
  { from:['send-sms','default'], to:'create-user' },
  { from:['create-user','default'], to:'pill:complete' },
];

/* =====================================================================
   Panel models — final decided section grammar (side-panel-redesign-epic
   §1.5 / FLOP-5698): four fixed sections, always in this order, on every
   step. Input folds into General (a step's target/content/config, minus
   whatever belongs in the other three). Error Management and Branching
   fold into Outcomes — failure/cancel is just another named branch, not a
   separate category (this also kills the old inconsistency where the same
   field was tagged Branching on some steps and Error Management on
   others). Output (data written downstream) stays distinct from Outcomes
   (control flow). Reporting is new: the step-data reporting toggle, always
   its own section.

   Within a section, fields are split Basic/Advanced by required-ness (see
   blockIsBasic() in app.js) — Basic fields render first and are never
   collapsed, Advanced fields collapse behind a disclosure. If a section has
   no Basic fields at all, there's no Advanced disclosure either — everything
   just renders flat (see renderEditMode() in app.js); a bare "Advanced"
   toggle over an otherwise-empty card reads as broken, not as "nothing
   required yet."

   If setting one field ever makes another conditionally required (the
   "hybrid" case), the Advanced disclosure auto-opens and flags it — this is
   now exercised for real by the Create User step below: External User ID is
   Basic/required, but Email/Phone/Username live in the same section's
   Advanced block, and leaving all three empty while External User ID is set
   raises an error on Email that force-opens Advanced (see its validate()).

   Title and Description are NOT a field group at all anymore — they live
   in the panel header, View-mode-only, editable there directly (see
   renderPanel()/onTitleOverride in app.js). They're intentionally absent
   from every PANELS entry below. */
const FIELD_GROUP_ORDER = ['General','Outcomes','Output','Reporting'];

/* Every step gets the same Reporting toggle — appended once, below, to
   every bespoke and generic panel entry rather than repeated inline. */
function withReporting(panel){
  panel.blocks.push({ group:'Reporting', kind:'methods',
    methods:[{ k:'report_step_data', label:'Report Step Data', on:false }] });
  return panel;
}

const PANELS = {
  'get-info': {
    blocks: [
      { group:'Output', schemaLink:true, fields:[
        { k:'app_data', kind:'expr', label:'App data', value:'{}' },
        { k:'output_var', kind:'text', label:'Output Variable', value:'clientData', hint:'Name of output variable for the step result' },
      ]},
    ],
  },
  'login-form': {
    blocks: [
      { group:'General', kind:'methods', methods:[
        { k:'m_password', label:'Password', on:true },
        { k:'m_passkeys', label:'Passkeys', on:true },
      ]},
      { group:'Output', schemaLink:true, fields:[
        { k:'app_data', kind:'expr', label:'App data', value:'{}' },
        { k:'output_var', kind:'text', label:'Output Variable', value:'loginData', hint:'Name of output variable for the step result' },
      ]},
      { group:'Outcomes', kind:'summary', label:'Branches', value:'Password, Passkeys' },
    ],
  },
  'password-auth': {
    blocks: [
      { group:'General', fields:[
        { k:'username', kind:'expr', label:'Username', value:'loginData.username', required:true,
          validate:v => v.trim() ? null : 'Required field not set' },
        { k:'password', kind:'expr', label:'Password', value:'', required:true,
          placeholder:'clientData.password',
          validate:v => v.trim() ? null : 'Required field not set' },
      ]},
      { group:'Output', fields:[
        { k:'error_var', kind:'text', label:'Error output variable', value:'', hint:'Name of error variable for the step result' },
      ]},
      { group:'Outcomes', fields:[
        { k:'on_fail', kind:'select', label:'Failure behavior', value:'Go To Failure Branch', options:['Go To Failure Branch','Abort Journey','Retry Step'] },
      ]},
    ],
  },
  'passkeys-auth': {
    blocks: [
      { group:'General', fields:[
        { k:'webauthn', kind:'expr', label:'Encoded result', value:'loginData.webauthn_encoded_result', hint:'WebAuthn Encoded Result',
          required:true, validate:v => v.trim() ? null : 'Required field not set' },
      ]},
      { group:'Output', fields:[
        { k:'error_var', kind:'text', label:'Error output variable', value:'', hint:'Name of error variable for the step result' },
        { k:'output_var', kind:'text', label:'Output Variable', value:'webauthnResult', hint:'Name of output variable for the step result' },
      ]},
      { group:'Outcomes', fields:[
        { k:'on_fail', kind:'select', label:'Failure behavior', value:'Go To Failure Branch', options:['Go To Failure Branch','Abort Journey','Retry Step'] },
      ]},
    ],
  },
  'known-device': {
    blocks: [
      { group:'General', fields:[
        { k:'binding_key', kind:'expr', label:'Crypto binding key', value:'clientData.crypto_binding_key' },
      ]},
      { group:'Output', fields:[
        { k:'output_var', kind:'text', label:'Output Variable', value:'isKnownDevice', hint:'Name of output variable for the step result' },
      ]},
    ],
  },
  'email-validation': {
    blocks: [
      { group:'General', fields:[
        { k:'email', kind:'expr', label:'Email', value:'clientData.userEmail', required:true,
          validate:v => v.trim() ? null : 'Required field not set' },
        { kind:'stepper-row', steppers:[
          { k:'code_length', label:'Code length', value:6, min:4, max:10 },
          { k:'expiry', label:'Expiry', labelNote:'(Minutes)', value:6, min:1, max:60 },
          { k:'max_attempts', label:'Max failed attempts', value:3, min:1, max:10 },
        ]},
      ]},
      { group:'Output', fields:[
        { k:'error_var', kind:'text', label:'Error Output Variable', value:'error', hint:'Name of error variable for the step result' },
      ]},
      { group:'Outcomes', basic:true, fields:[
        { k:'on_fail', kind:'select', label:'End user failed validation', value:'Go to action failed branch', options:['Go to action failed branch','Abort journey','Retry step'] },
        { k:'on_cancel', kind:'select', label:'End user clicked cancel', value:'Abort journey', options:['Abort journey','Go to action failed branch'] },
      ]},
      { group:'Outcomes', kind:'branches' },
    ],
  },
  'send-sms': {
    blocks: [
      { group:'General', fields:[
        { k:'recipient', kind:'expr', label:'Recipient', value:'clientData.userPhone', required:true,
          validate:v => v.trim() ? null : 'Required field not set' },
        { k:'message_body', kind:'expr', label:'Message', value:'Your verification is complete.', required:true,
          validate:v => v.trim() ? null : 'Required field not set' },
        { k:'sender', kind:'expr', label:'From', value:'', required:true,
          validate:v => v.trim() ? null : 'Required field not set' },
        { k:'sms_provider', kind:'ec', ecType:'sms', label:'SMS service', value:'', required:true,
          validate:v => v.trim() ? null : 'Required field not set' },
      ]},
      { group:'Output', fields:[
        { k:'output_var', kind:'text', label:'Output Variable', value:'', hint:'Name of the variable to store the results of this action' },
      ]},
      { group:'Outcomes', fields:[
        { k:'on_fail', kind:'select', label:'Failure behavior', value:'Go To Failure Branch', options:['Go To Failure Branch','Abort Journey','Retry Step'] },
      ]},
    ],
  },
  /* Modeled on the roulette prototype's Create User step
     (omriharel-15.github.io/new-steps-field-categories) — the one step in
     this journey with both a real Basic/Advanced split driven purely by
     required-ness (External User ID vs. everything else) and the hybrid
     conditional-required case. It also carries enough pre-filled optional
     fields (First name/Last name/Country/Locale) to exercise View mode's
     "collapse heavy sections" rule out of the box. */
  'create-user': {
    blocks: [
      { group:'General', fields:[
        { k:'extuid', kind:'expr', label:'External User ID', value:'clientData.userExternalId', required:true,
          validate:v => v.trim() ? null : 'Required field not set' },
      ]},
      { group:'General', fields:[
        { k:'email', kind:'expr', label:'Email', value:'',
          validate:v => {
            if(v.trim()) return null;
            const extuidF=findField('create-user','extuid');
            const phoneF=findField('create-user','phone');
            const userF=findField('create-user','username');
            const extuidSet=!!(extuidF && extuidF.value.trim());
            const otherSet=!!((phoneF&&phoneF.value.trim())||(userF&&userF.value.trim()));
            return (extuidSet && !otherSet) ? 'Set at least one of Email, Phone, or Username' : null;
          } },
        { k:'phone', kind:'expr', label:'Phone', value:'' },
        { k:'username', kind:'expr', label:'Username', value:'' },
        { k:'first_name', kind:'expr', label:'First name', value:'clientData.firstName' },
        { k:'last_name', kind:'expr', label:'Last name', value:'clientData.lastName' },
        { k:'country', kind:'text', label:'Country', value:'US' },
        { k:'locale', kind:'text', label:'Locale', value:'en-US' },
      ]},
      { group:'Output', fields:[
        { k:'output_var', kind:'text', label:'Output Variable', value:'newUser', hint:'Name of output variable for the step result' },
      ]},
      { group:'Outcomes', fields:[
        { k:'on_fail', kind:'select', label:'Failure behavior', value:'Go To Failure Branch', options:['Go To Failure Branch','Abort Journey','Retry Step'] },
      ]},
    ],
  },
};
Object.keys(PANELS).forEach(k=>withReporting(PANELS[k]));

/* External Connections — options + per-type metadata for the inline creation
   dialog. The dropdown must be honest about enabled/disabled — disabled
   connections stay visible, just not selectable. Seeded with one
   real-looking option per §4/R6.1. */
const EC_OPTIONS = {
  sms: [
    { id:'twilio-prod', name:'Twilio Prod', enabled:true },
    { id:'legacy-sms-gateway', name:'Legacy SMS Gateway', enabled:false },
  ],
};

const EC_TYPE_META = {
  sms: { category:'Communication', type:'Custom SMS Provider', uriPlaceholder:'https://api.sms-provider.com/send' },
};

const CUSTOM_BRANCHES = {
  'email-validation': {
    outputVar:'',
    items:[ { id:'branch_1', display:'' } ],
  },
};

/* Edge coloring — prod connection.component.ts logic:
   default grey #999999 @1px; when the edge's source/target node is hovered
   or selected, it takes on its link color (success green / failure red /
   else blue) @2px. See edgeStyle() in app.js. */
const LINK_COLORS = { success:'#01B678', failure:'#ED3232', plain:'#6981FF' };

/* =====================================================================
   Add step — right slide-over, product taxonomy
   ===================================================================== */
const AS_CATS = [
  { name:'Featured', icon:I.star },
  { name:'User Interactions', icon:I.people },
  { name:'Flow Controllers', icon:I.flow },
  { name:'Authentication', icon:I.keyuser },
  { name:'Fraud Prevention', icon:I.shield },
  { name:'Identity Verification', icon:I.idcard },
  { name:'User Management', icon:I.usercog },
  { name:'Session Management', icon:I.session },
  { name:'Data Processing', icon:I.db },
  { name:'Connectors & Code', icon:I.connect },
];
const STEP_LIBRARY = {
  'Featured': [
    {t:'Delete Mobile PIN (Deprecated)',d:'Delete a PIN code registered on the device.',deprecated:true,group:'AUTHENTICATION',panelKey:'generic-auth'},
    {t:'Face Authentication',d:'Authenticate user using face biometric comparison.',userFacing:true,branches:['success','failure'],group:'AUTHENTICATION',panelKey:'generic-auth'},
    {t:'Login Form',d:'Present login options and create branches based on choice.',userFacing:true,branches:['plain'],group:'AUTHENTICATION',panelKey:'login-form'},
    {t:'Passkeys Authentication',d:'Authenticate with a user using WebAuthn/Passkey.',userFacing:true,branches:['success','failure'],group:'AUTHENTICATION',panelKey:'passkeys-auth'},
    {t:'PingOne OIDC Authentication',d:'Authenticate a user with PingOne using OIDC redirect flow.',userFacing:true,branches:['success','failure'],group:'AUTHENTICATION',panelKey:'generic-auth'},
    {t:'Register Face',d:'Register face biometric reference for user authentication.',userFacing:true,branches:['success','failure'],group:'AUTHENTICATION',panelKey:'generic-auth'},
    {t:'Register Passkeys',d:'Register a passkey for a user.',userFacing:true,branches:['success','failure'],group:'AUTHENTICATION',panelKey:'generic-auth'},
    {t:'SMS OTP Authentication',d:'Authenticate a user through a one-time SMS passcode.',userFacing:true,branches:['success','failure'],group:'AUTHENTICATION',panelKey:'generic-otp'},
  ],
  'User Interactions': [
    {t:'Collect Information',d:'Collect information from users.',userFacing:true,branches:['plain'],panelKey:'generic-collect'},
    {t:'Display Information',d:'Display information to users.',userFacing:true,branches:[],panelKey:'generic-collect'},
    {t:'Web to Mobile Transaction Signing',d:'Sign a transaction on mobile initiated from web.',userFacing:true,branches:['success','failure'],panelKey:'generic-auth'},
  ],
  'Flow Controllers': [
    {t:'Condition',d:'Check if a condition is met.',branches:['success','failure'],panelKey:'generic-condition'},
    {t:'Match Case',d:'Choose a branch based on an expression.',branches:[],panelKey:'generic-condition'},
    {t:'While Loop',d:'Repeat steps while a condition is met.',branches:[],panelKey:'generic-condition'},
    {t:'Complete Journey',d:'Flag this journey as successfully completed.',branches:[]},
    {t:'Reject Access',d:'Complete the journey with a rejection.',branches:[]},
  ],
  'Authentication': [
    {t:'Email OTP Authentication',d:'Require user to authenticate through a one-time email passcode.',userFacing:true,branches:['success','failure'],panelKey:'generic-otp'},
    {t:'Login Form',d:'Present login options and create branches based on choice.',userFacing:true,branches:['plain'],panelKey:'login-form'},
    {t:'Passkeys Authentication',d:'Authenticate with a user using WebAuthn/Passkey.',userFacing:true,branches:['success','failure'],panelKey:'passkeys-auth'},
    {t:'Password Authentication',d:'Authenticate a user with their password.',userFacing:true,branches:['success','failure'],panelKey:'password-auth'},
    {t:'SMS OTP Authentication',d:'Authenticate a user through a one-time SMS passcode.',userFacing:true,branches:['success','failure'],panelKey:'generic-otp'},
    {t:'TOTP Authentication',d:'Authenticate a user through a time-based one-time passcode.',userFacing:true,branches:['success','failure'],panelKey:'generic-otp'},
  ],
  'Fraud Prevention': [
    {t:'Risk Recommendation',d:'Branch the journey by risk recommendation on user activity.',branches:['success','failure','plain'],panelKey:'generic-server'},
    {t:'Evaluate Transaction',d:'Evaluate a transaction for fraud signals.',branches:[],panelKey:'generic-server'},
  ],
  'Identity Verification': [
    {t:'Document Verification (API)',d:'Verify identity by comparing a validated ID to a selfie.',userFacing:true,branches:['success','failure'],panelKey:'generic-auth'},
    {t:'Selfie Acquisition',d:'Capture a selfie for verification.',userFacing:true,branches:['success','failure'],panelKey:'generic-auth'},
  ],
  'User Management': [
    {t:'Create User',d:'Add a new user.',branches:[],panelKey:'generic-server'},
    {t:'Get User Identifiers',d:'Fetch a user\'s registered identifiers.',branches:['success','failure'],panelKey:'generic-server'},
    {t:'Update User',d:'Update an existing user.',branches:[],panelKey:'generic-server'},
    {t:'Register Device',d:'Register a device to a user (Cryptobinding).',branches:[],panelKey:'generic-server'},
  ],
  'Session Management': [
    {t:'Validate Token',d:'Validate a token, abort the journey upon failure.',branches:[],panelKey:'generic-server'},
    {t:'Has Valid SSO Session',d:'Branch on whether a valid SSO session exists.',branches:['success','failure'],panelKey:'generic-server'},
    {t:'Enrich SSO Session',d:'Enrich an SSO session.',branches:[],panelKey:'generic-server'},
  ],
  'Data Processing': [
    {t:'Set Temporary Variables',d:'Store values in variables for later use.',branches:[],panelKey:'generic-condition'},
    {t:'Provide JSON Data',d:'Send expression JSON data for processing.',branches:[],panelKey:'generic-collect'},
  ],
  'Connectors & Code': [
    {t:'Invoke a Web Service',d:'Invoke an external web service.',branches:[],panelKey:'generic-server'},
    {t:'Invoke External IDP',d:'Authenticate against an external identity provider.',userFacing:true,branches:['success','failure'],panelKey:'generic-auth'},
    {t:'Send Email',d:'Send an email through a configured connection.',branches:[],panelKey:'generic-send'},
  ],
};
const PINNED = ['Login Form','Passkeys Authentication'];

/* ---------- Spark (mocked) ----------
   Real Spark can suggest AuthScript but is known to hallucinate namespace
   members (see authscript.md) — every entry here is hand-picked to actually
   be plausible/valid against the documented @-namespaces. Entries with a
   `match` are real field/expression pairs Omri supplied — when the modal
   opens on that exact (node, field), that suggestion is pinned to the top;
   everywhere else it's just part of the general pool. The three original
   generic examples stay in the pool too. */
const SPARK_LIBRARY=[
  { match:{node:'password-auth',field:'password'},
    label:"Get the password the user just submitted from the client request",
    snippet:'@policy.request().params.current_password' },
  { label:"Get the external user ID for the user being registered",
    snippet:'@policy.userTokens().external_user_id' },
  { label:"Get the new password the user is setting from the client request",
    snippet:'@policy.request().params.new_password' },
  { label:"Safely decrypt the session token from the request, defaulting to empty if it's missing or invalid",
    snippet:
`@policy.request().params.session_token
  ? (try @crypto.verifyAndDecryptExternalToken(@policy.request().params.session_token, "session_management_key", "db", "session_management_key", "db") catch {})
  : {}` },
  { label:"Pull the access token out of the session token object",
    snippet:'session_token["access_token"]' },
  { label:"Check if the user's browser is Chrome",
    snippet:'@std.contains(userAgent, `Chrome`)' },
  { label:'Give me an example of code I can use here',
    snippet:
`let email = @policy.userContext().email,
    now = @time().nowISO
return \`User \${email} reached this step at \${now}\`` },
  { label:'Provide code to take an input object, and copy all keys into a target object with encrypted values.',
    snippet:
`let keys = @std.keys(inputObject)
return @std.reduce(
  keys,
  (target, key) => @std.kv(target, key, @crypto.aesEncrypt(@strings.toJson(inputObject[key]), "encryption-key")),
  {}
)` },
  { label:'How can I generate a random string of a given length and a set of characters?',
    snippet:
`let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    length = 12,
    indices = @std.map([0,1,2,3,4,5,6,7,8,9,10,11], (i) => @math.round(@math.random() * (@strings.length(chars) - 1)))
return @std.reduce(indices, (acc, idx) => acc + @strings.substring(chars, idx, idx + 1), "")` },
];

/* =====================================================================
   Generic panel templates — used when a step added from the library
   doesn't have a bespoke PANELS entry. Keyed with a 'generic-' prefix
   so they never clash with real node IDs.
   ===================================================================== */
Object.assign(PANELS, {
  'generic-auth': {
    blocks: [
      { group:'General', fields:[
        { k:'identifier', kind:'expr', label:'Identifier', value:'', placeholder:'e.g. clientData.username', hint:'User identifier passed to this step' },
      ]},
      { group:'Output', fields:[
        { k:'error_var', kind:'text', label:'Error Output Variable', value:'error', hint:'Name of error variable for the step result' },
        { k:'output_var', kind:'text', label:'Output Variable', value:'', hint:'Name of output variable for the step result' },
      ]},
      { group:'Outcomes', fields:[
        { k:'on_fail', kind:'select', label:'Failure behavior', value:'Go To Failure Branch', options:['Go To Failure Branch','Abort Journey','Retry Step'] },
      ]},
    ],
  },
  'generic-otp': {
    blocks: [
      { group:'General', fields:[
        { k:'identifier', kind:'expr', label:'Identifier', value:'', placeholder:'e.g. clientData.email', hint:'Address to send the OTP to' },
        { kind:'stepper-row', steppers:[
          { k:'code_length', label:'Code length', value:6, min:4, max:10 },
          { k:'expiry', label:'Expiry', labelNote:'(Minutes)', value:10, min:1, max:60 },
          { k:'max_attempts', label:'Max failed attempts', value:3, min:1, max:10 },
        ]},
      ]},
      { group:'Output', fields:[
        { k:'error_var', kind:'text', label:'Error Output Variable', value:'error', hint:'Name of error variable for the step result' },
      ]},
      { group:'Outcomes', basic:true, fields:[
        { k:'on_fail', kind:'select', label:'End user failed validation', value:'Go to action failed branch', options:['Go to action failed branch','Abort journey','Retry step'] },
        { k:'on_cancel', kind:'select', label:'End user clicked cancel', value:'Abort journey', options:['Abort journey','Go to action failed branch'] },
      ]},
    ],
  },
  'generic-collect': {
    blocks: [
      { group:'Output', schemaLink:true, fields:[
        { k:'app_data', kind:'expr', label:'App data', value:'{}' },
        { k:'output_var', kind:'text', label:'Output Variable', value:'', hint:'Name of output variable for the step result' },
      ]},
    ],
  },
  'generic-condition': {
    blocks: [
      { group:'General', fields:[
        { k:'condition', kind:'expr', label:'Condition', value:'', placeholder:'e.g. user.age >= 18', hint:'Expression evaluated to determine the branch' },
      ]},
    ],
  },
  'generic-server': {
    blocks: [
      { group:'General', fields:[
        { k:'input_data', kind:'expr', label:'Input data', value:'{}', hint:'Data passed to this step' },
      ]},
      { group:'Output', fields:[
        { k:'output_var', kind:'text', label:'Output Variable', value:'', hint:'Name of output variable for the step result' },
        { k:'error_var', kind:'text', label:'Error Output Variable', value:'error', hint:'Name of error variable for the step result' },
      ]},
      { group:'Outcomes', fields:[
        { k:'on_fail', kind:'select', label:'Failure behavior', value:'Go To Failure Branch', options:['Go To Failure Branch','Abort Journey','Retry Step'] },
      ]},
    ],
  },
  'generic-send': {
    blocks: [
      { group:'General', fields:[
        { k:'recipient', kind:'expr', label:'Recipient', value:'', placeholder:'e.g. clientData.email', hint:'Recipient address or identifier' },
        { k:'message_body', kind:'expr', label:'Message body', value:'', placeholder:'e.g. Your code is {{code}}' },
      ]},
      { group:'Output', fields:[
        { k:'output_var', kind:'text', label:'Output Variable', value:'', hint:'Name of the variable to store the results of this action' },
      ]},
      { group:'Outcomes', fields:[
        { k:'on_fail', kind:'select', label:'Failure behavior', value:'Go To Failure Branch', options:['Go To Failure Branch','Abort Journey','Retry Step'] },
      ]},
    ],
  },
});
['generic-auth','generic-otp','generic-collect','generic-condition','generic-server','generic-send'].forEach(k=>withReporting(PANELS[k]));
