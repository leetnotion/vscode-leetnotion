import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeTextArea } from '@vscode/webview-ui-toolkit';

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeCheckbox(), vsCodeTextArea());
