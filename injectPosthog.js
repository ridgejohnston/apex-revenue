// inject-posthog.js
import './node_modules/posthog-js/dist/posthog-recorder.js'  // ← changed from recorder.js
import posthog from './node_modules/posthog-js/dist/module.full.no-external.js'

posthog.init('<ph_project_api_key>', {
  api_host: 'https://us.i.posthog.com',
  advanced_disable_decide: true,
  __preview_remote_config: false,
  disable_session_recording: false,
  enable_recording_console_log: true,
  session_recording: {
    maskAllInputs: true,
  },
})
