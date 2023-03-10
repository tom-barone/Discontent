import * as browser from "webextension-polyfill";
import { Controller } from "@hotwired/stimulus";
import { Settings, IconName } from "../../settings";
import VotingButtonController from "./voting_button_controller";

const FADE_IN_AND_OUT_TIME = 300; // milliseconds
const FADE_OUT_CHECK_AFTER = 3; // seconds

export default class extends Controller {
  static targets = ["input", "spinner", "check", "error"];
  static values = {
    iconName: String,
  };
	static outlets = [ "voting-button" ]
  declare readonly inputTarget: HTMLInputElement;
  declare readonly spinnerTarget: HTMLDivElement;
  declare readonly checkTarget: HTMLElement;
  declare readonly errorTarget: HTMLElement;
  declare readonly iconNameValue: IconName;
  declare timer: NodeJS.Timeout;
	declare readonly votingButtonOutlets: Array<VotingButtonController>;
	declare settings: Settings;

  connect() {
		this.settings = new Settings(browser);
    // Load icons from settings
    this._showSpinner();
    this.settings
      .get_icon(this.iconNameValue)
      .then((icon) => {
        // Don't want to show the check mark on the first load
        this._hideAll();
        this.inputTarget.value = icon;
      })
      .catch((error) => {
        this._showError(error);
      });
  }

  update() {
    this._showSpinner();
    this.settings
      .set_icon(this.iconNameValue, this.inputTarget.value)
      .then(() => {
        this._showCheck();
      })
      .then(() => {
				// Reload icons on the voting page with new changes
        this.votingButtonOutlets.forEach((outlet) => {
					outlet.load_icon();
				});
      })
      .catch((error) => {
        this._showError(error);
      });
  }

  _fadeIn(element: HTMLElement) {
    element.animate([{ opacity: 0 }, { opacity: 1 }], FADE_IN_AND_OUT_TIME);
    element.classList.remove("d-none");
  }

  _fadeOut(element: HTMLElement, after_milliseconds: number) {
    this.timer && clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      element.animate([{ opacity: 1 }, { opacity: 0 }], FADE_IN_AND_OUT_TIME);
      setTimeout(() => {
        element.classList.add("d-none");
      }, FADE_IN_AND_OUT_TIME);
    }, after_milliseconds);
  }

  _hideAll() {
    this.spinnerTarget.classList.add("d-none");
    this.checkTarget.classList.add("d-none");
    this.errorTarget.classList.add("d-none");
  }

  _showSpinner() {
    this.checkTarget.classList.add("d-none");
    this.errorTarget.classList.add("d-none");
    this._fadeIn(this.spinnerTarget);
  }

  _showCheck() {
    // The check will disappear after some time
    this.spinnerTarget.classList.add("d-none");
    this.errorTarget.classList.add("d-none");
    this._fadeIn(this.checkTarget);
    this._fadeOut(this.checkTarget, FADE_OUT_CHECK_AFTER * 1000);
  }

  _showError(error: string) {
    this.spinnerTarget.classList.add("d-none");
    this.checkTarget.classList.add("d-none");
    this._fadeIn(this.errorTarget);
    this.errorTarget.title = error;
  }
}
