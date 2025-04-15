
class ATCRadioData {
}
class ATCDialogLine {
}
class ATCDialogData {
    constructor() {
        this.IsOn = false;
    }
}
class ATCListener extends ViewListener.ViewListener {
    onUpdateATCData(callback) {
        this.on("UpdateATCAllData", callback);
    }
    onUpdateDialogs(callback) {
        this.on("UpdateATCDialogsData", callback);
    }
    onUpdatePromptAndOptions(callback) {
        this.on("UpdateATCPromptAndOptionsData", callback);
    }
    onUpdateATISData(callback) {
        this.on("UpdateATCATISData", callback);
    }
    onUpdateATCDRadioData(callback) {
        this.on("UpdateATCDRadioData", callback);
    }
    onUpdateCopilotState(callback) {
        this.on("UpdateCopilotState", callback);
    }
}
function RegisterATCListener(callback) {
    return RegisterViewListenerT("JS_LISTENER_ATC", callback, ATCListener);
}

class DialogElement extends TemplateElement {
    constructor() {
        super(...arguments);
    }
    connectedCallback(){
        super.connectedCallback();
        this._emitterElem = this.querySelector(".emitter");
        this._messageTextElem = this.querySelector(".messageText");
    }
    get templateID() {return "ATC_DIALOG_TEMPLATE";}
    get relyOnRealHeight(){return true;}

    SetData(data)
    {
        this._emitterElem.innerText=data.Emitter;
        this._messageTextElem.innerText=data.Message;
    }
}
DialogElement.getRenderSize = function(){
    return null;
};

class CustomATCPanel extends UIElement {
    constructor() {
        super(...arguments);
        this._radioIsOn = false;
        this._dialogsDataLength = 0;
        this.onDataUpdate = (data) => {
            this.UpdateEnabledPanels(data.IsOn);
            this.UpdateDialogs(data);
            this.UpdateOptions(data);
        };
        this.onUpdateDialogs = (data) => {
            this.UpdateEnabledPanels(data.IsOn);
            this.UpdateDialogs(data);
        };
        this.onUpdateOptions = (data) => {
            this.UpdateEnabledPanels(data.IsOn);
            this.UpdateOptions(data);
        };
        this.onUpdateATISData = (data) => {
            this.UpdateEnabledPanels(data.IsOn);
        };
        this.onUpdateRadioData = (data) => {
            this.UpdateEnabledPanels(data.IsOn);
        };
        this.onUpdateCopilotState = (bVal) => {
        };
        
    }
    connectedCallback(){
        super.connectedCallback();
        this._disconnectedPanel = document.getElementById("RadioOff");
        this._connectedPanel = document.getElementById("RadioOn");
        this._dialogs = document.getElementById("ATCDialogs");
        this._atcPromptMessage = document.getElementById("ATCPromptMessage");
        this._atcActions = document.getElementById("ATCActions");
        this._disconnectedPanel.classList.toggle('hide', false);
        this._connectedPanel.classList.toggle('hide', true);
        this.ATCListener = RegisterATCListener(() => {
        });
        this.RegisterATCCallbacks();
    }

    RegisterATCCallbacks() {
        this.ATCListener.onUpdateATCData(this.onDataUpdate);
        this.ATCListener.onUpdateDialogs(this.onUpdateDialogs);
        this.ATCListener.onUpdatePromptAndOptions(this.onUpdateOptions);
        this.ATCListener.onUpdateATISData(this.onUpdateATISData);
        this.ATCListener.onUpdateATCDRadioData(this.onUpdateRadioData);
        this.ATCListener.on("UpdateCopilotState", this.onUpdateCopilotState);
    }
    UpdateEnabledPanels(isOn) {
        if(this._radioIsOn == isOn){
            return;
        }
        this._radioIsOn = isOn;        
        this._disconnectedPanel.classList.toggle('hide', isOn);
        this._connectedPanel.classList.toggle('hide', !isOn);
    }

    UpdateDialogs(data) {
        var added = false;
        for(var i= this._dialogsDataLength; i <data.Dialogs.length;i++){
            let currentData = data.Dialogs[i];
            if (currentData.Message.length != 0) {
                var elem = document.createElement("li");
                let div = new UIElement();
                div.classList.add('wrapper');
                div.setAttribute("items-to-read", ".message");
                let span = document.createElement('div');
                span.classList.add('message');
                span.innerHTML = `<span><b>${currentData.Emitter}</b> : ${currentData.Message}</span>`;
                let divLeft = document.createElement('div');
                divLeft.classList.add('meta');
                div.appendChild(divLeft);
                div.appendChild(span);
                elem.appendChild(div);
                if (currentData.Type == 1) {
                    elem.className = "ATCDialogs_Agent";
                    let icon = document.createElement('icon-element');
                    icon.setAttribute('icon-url', '/icons/ATC/ICON_ATC_NO_MARGIN.svg');
                    divLeft.appendChild(icon);
                }
                else if (currentData.Type == 2)
                    elem.className = "ATCDialogs_Aircraft";
                else if (currentData.Type == 5)
                    elem.className = "ATCDialogs_ATIS";
                this._dialogs.appendChild(elem);
                added = true;
            }

        }
        if(added){
            this._dialogsDataLength = data.Dialogs.length;
            while(this._dialogs.childElementCount>50){
                this._dialogs.removeChild(this._dialogs.firstChild);
            }
            this._dialogs.lastChild.scrollIntoView();
        }
    }

    UpdateOptions(data){
        this._atcPromptMessage.innerText = data.Prompt;
        while (this._atcActions.firstChild) {
            this._atcActions .removeChild(this._atcActions.firstChild);
        }
        for (var i = 0; i < data.Options.length; i++) {
            if (!data.OptionsActive[i]) {
                continue;
            }
            var elemdiv = document.createElement("div");
            elemdiv.className = "ATCOptions_Clickable";
            if (data.Options[i].length != 0) {
                const regex = /(\d){1} - (.*)/g;
                let result = regex.exec(data.Options[i]);
                let btn = new NewPushButtonElement;
                btn.classList.add('condensed-interactive');
                btn.disable(data.MessageBeingPlayed && !data.OptionsNoMsg[i]);
                btn.classList.add('small');
                btn.setAttribute('title', result[1] + " - " + result[2]);
                btn.addEventListener("OnValidate", function (k) {
                    this.ATCListener.trigger("ATC_SELECT_OPTION", k);
                }.bind(this, i));
                elemdiv.appendChild(btn);
            }
            this._atcActions.appendChild(elemdiv);
        }
    }
}

window.customElements.define('custom-atc-panel', CustomATCPanel);
window.customElements.define('dialog-element', DialogElement);
checkAutoload();
