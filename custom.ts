/**
 * Object Blocks
 */
//% weight=100 color=#0fbc11 icon="\uf1b2"
//% groups='["Definitions", "Getters", "Setters", "Instances", "Utility"]'
namespace objects {

    export class NounInstance {
        name: string;
        _verbs: { [key: string]: VerbDefinition };
        _data: any;
        _sprite: Sprite;

        constructor(name: string, verbs: { [key: string]: VerbDefinition }) {
            this.name = name;
            this._verbs = verbs;
            this._data = {};
            this._sprite = null;
        }
    }

    export class VerbDefinition {
        action: (self: NounInstance) => void;
        names: string[];

        constructor(action: (self: NounInstance) => void, names: string[]) {
            this.action = action;
            this.names = names;
        }
    }

    export class NounDefinition {
        name: string;
        _verbs: { [key: string]: VerbDefinition };

        constructor(name: string) {
            this.name = name;
            this._verbs = {};
        }
    }

    const nounRegistry: { [key: string]: NounDefinition } = {};
    const allInstances: NounInstance[] = [];
    const _nounDefinitionStack: NounDefinition[] = [];
    const _verbReturnStack: any[] = [];
    const _verbFrameStack: any[] = [];
    const _instanceStack: NounInstance[] = [];

    function peek(stack: any[]): any {
        if (stack.length > 0) {
            return stack[stack.length - 1];
        }
        return undefined;
    }

    function _executeVerb(instance: any, verbName: string, passedArgs: any[]): void {
        let self = instance as NounInstance;
        if (self && self._verbs && self._verbs[verbName]) {
            let verbDef = self._verbs[verbName];

            let argMap: any = {};
            for (let i = 0; i < verbDef.names.length; i++) {
                if (passedArgs[i] !== undefined) {
                    argMap[verbDef.names[i]] = passedArgs[i];
                }
            }

            _verbFrameStack.push(argMap);
            _instanceStack.push(self)
            verbDef.action(self);
            _instanceStack.pop();
            _verbFrameStack.pop();
        }
    }

    /**
     * Noun Autocomplete Bucket
     */
    //% blockId=objects_noun_picker
    //% block="$key"
    //% shim=TD_ID
    //% key.fieldEditor="autocomplete"
    //% key.fieldOptions.decompileLiterals=true
    //% key.fieldOptions.key="objects_noun_picker"
    //% blockHidden=true
    export function _nounPicker(key: string): string {
        return key;
    }

    /**
     * Verb Autocomplete Bucket
     */
    //% blockId=objects_verb_picker
    //% block="$key"
    //% shim=TD_ID
    //% key.fieldEditor="autocomplete"
    //% key.fieldOptions.decompileLiterals=true
    //% key.fieldOptions.key="objects_verb_picker"
    //% blockHidden=true
    export function _verbPicker(key: string): string {
        return key;
    }

    /**
     * Property Autocomplete Bucket
     */
    //% blockId=objects_property_picker
    //% block="$key"
    //% shim=TD_ID
    //% key.fieldEditor="autocomplete"
    //% key.fieldOptions.decompileLiterals=true
    //% key.fieldOptions.key="objects_property_picker"
    //% blockHidden=true
    export function _propertyPicker(key: string): string {
        return key;
    }

    /**
     * Defines a noun.
     */
    //% blockId="define_noun"
    //% group="Definitions"
    //% block="define noun $name"
    //% name.shadow="objects_noun_picker"
    //% handlerStatement=1
    export function defineNoun(name: string, userDefinition: () => void): void {
        let nounDef = new NounDefinition(name);
        _nounDefinitionStack.push(nounDef);
        userDefinition();
        nounRegistry[name] = nounDef;
        _nounDefinitionStack.pop();
    }

    /**
     * Defines a verb with arguments.
     */
    //% blockId="define_aritous_verb"
    //% group="Definitions"
    //% block="define verb $verbName given $argNames"
    //% verbName.shadow="objects_verb_picker"
    //% argNames.shadow="text"
    //% argNames.defl="foo, bar"
    //% handlerStatement=1
    export function defineAritousVerb(
        verbName: string,
        argNames: string,
        definition: () => void
    ): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun) {
            let parsedNames = argNames.split(",").map(s => s.trim());
            currentNoun._verbs[verbName] = new VerbDefinition(definition, parsedNames);
        }
    }

    /**
    * Defines a simple verb.
    */
    //% blockId="define_nullary_verb"
    //% group="Definitions"
    //% block="define verb $verbName"
    //% verbName.shadow="objects_verb_picker"
    //% handlerStatement=1
    export function defineNullaryVerb(
        verbName: string,
        definition: () => void
    ): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun) {
            currentNoun._verbs[verbName] = new VerbDefinition(definition, []);
        }
    }

    /**
     * Set a property on a specific instance.
     */
    //% blockId="set_instance_property"
    //% group="Setters"
    //% block="set $instance $key to $value"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% key.shadow="objects_property_picker"
    export function setInstanceProperty(instance: any, key: string, value: any): void {
        let target = instance as NounInstance;
        if (target) {
            target._data[key] = value;
        }
    }

    /**
     * Get a property from a specific instance.
     */
    //% blockId="get_instance_array_property"
    //% group="Getters"
    //% block="$key array of $instance"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% key.shadow="objects_property_picker"
    export function getInstanceArrayProperty(instance: any, key: string): any[] {
        let target = instance as NounInstance;
        return target ? target._data[key] : null;
    }

    /**
     * Get a property from a specific instance.
     */
    //% blockId="get_instance_property"
    //% group="Getters"
    //% block="$key of $instance"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% key.shadow="objects_property_picker"
    export function getInstanceProperty(instance: any, key: string): any {
        let target = instance as NounInstance;
        return target ? target._data[key] : null;
    }

    /**
     * Gets an argument passed to the verb.
     */
    //% blockId="get_verb_local_variable"
    //% group="Getters"
    //% block="get $localName"
    //% localName.shadow="text"
    //% localName.defl="foo"
    export function getLocal(localName: string): any {
        let frame = peek(_verbFrameStack);
        if (frame && frame[localName] !== undefined) {
            return frame[localName];
        }
        return "";
    }

    /**
    * Sets variable local to the verb being definied. Put this inside a verb definition block.
    */
    //% blockId="set_verb_local_variable"
    //% group="Setters"
    //% block="set $localName to $value"
    //% localName.shadow="text"
    //% localName.defl="foo"
    export function setLocalVariable(localName: string, value: any): void {
        let frame = peek(_verbFrameStack);
        if (frame) {
            frame[localName] = value;
        }
    }

    /**
     * Provide an answer from the verb being defined. Put this in a verb definition block.
     */
    //% blockId="answer"
    //% group="Definitions"
    //% block="answer with $value"
    //% value.shadow="self_block"
    //% value.defl="self_block"
    //% terminator=1
    export function answer(value: any): void {
        _verbReturnStack.push(value);
    }

    /**
    * Creates a new instance of a noun.
    */
    //% blockId="new_instance"
    //% group="Instances"
    //% block="new $nounName"
    //% nounName.shadow="objects_noun_picker"
    //% blockSetVariable="myNoun"
    export function newInstance(nounName: string): any {
        if (nounRegistry[nounName]) {
            let nounDef = nounRegistry[nounName];
            let it = new NounInstance(nounDef.name, nounDef._verbs);
            allInstances.push(it);
            return it;
        }
        return null;
    }

    /**
     * Gets an array of all instances of a specific noun.
     */
    //% blockId="get_all_instances_of"
    //% group="Instances"
    //% block="array of all $nounName"
    //% nounName.shadow="objects_noun_picker"
    export function getAllInstancesOf(nounName: string): any[] {
        let result: NounInstance[] = [];
        for (let inst of allInstances) {
            if (inst.name === nounName) {
                result.push(inst);
            }
        }
        return result;
    }

    /**
     * A reference to yourself.
     */
    //% blockId="self_block"
    //% group="Definitions"
    //% block="self"
    export function self(): any {
        return peek(_instanceStack)
    }

    /**
     * Tells an instance to do a verb.
     */
    //% blockId="tell"
    //% group="Instances"
    //% block="tell $instance $verbName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% verbName.shadow="objects_verb_picker"
    //% inlineInputMode=inline
    export function tell(instance: any, verbName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any): void {
        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        let depth = _verbReturnStack.length;
        _executeVerb(instance, verbName, args);

        if (depth < _verbReturnStack.length) {
            _verbReturnStack.pop();
        }
    }

    /**
    * Asks a noun for an answer.
    */
    //% blockId="ask"
    //% group="Instances"
    //% block="ask $instance $verbName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% verbName.shadow="objects_verb_picker"
    //% inlineInputMode=inline
    export function ask(instance: any, verbName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any): any {
        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        _executeVerb(instance, verbName, args);
        return _verbReturnStack.pop();
    }

    // ==========================================
    // SPRITE LINKING
    // ==========================================

    /**
     * Links a noun to a sprite instance.
     */
    //% blockId="set_instance_sprite"
    //% group="Setters"
    //% block="set $instance sprite $sprite"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% sprite.shadow="variables_get"
    export function setInstanceSprite(sprite: Sprite, instance: any): void {
        let inst = instance as NounInstance;
        if (sprite && inst) {
            inst._sprite = sprite;
            sprite.data["noun_instance"] = inst;
            sprite.onDestroyed(() => {
                const index = allInstances.indexOf(inst);
                if (index > -1) {
                    allInstances.splice(index, 1);
                }
                inst._sprite = null;
            });
        }
    }

    /**
    * Links a sprite to a noun instance.
    */
    //% blockId="set_sprite_noun"
    //% group="Setters"
    //% block="set $sprite noun $instance"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% sprite.shadow="variables_get"
    export function setSpriteNoun(sprite: Sprite, instance: any): void {
        let inst = instance as NounInstance;
        if (sprite && inst) {
            sprite.data["noun_instance"] = inst;
        }
    }

    /**
     * Gets the noun instance associated with a sprite.
     */
    //% blockId="get_noun_from_sprite"
    //% group="Getters"
    //% block="$sprite noun"
    //% sprite.shadow="variables_get"
    export function getNounFromSprite(sprite: Sprite): any {
        if (sprite && sprite.data["noun_instance"]) {
            return sprite.data["noun_instance"];
        }
        return null;
    }

    /**
     * Gets the sprite associated with a noun instance.
     */
    //% blockId="get_sprite_from_noun"
    //% group="Getters"
    //% block="$instance sprite"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    export function getSpriteFromNoun(instance: any): Sprite {
        let self = instance as NounInstance;
        if (self && self._sprite) {
            return self._sprite;
        }
        return null;
    }

    //% blockId="lerp_block"
    //% group="Utility"
    //% block="lerp $start to $end by $amount"
    //% start.defl=0
    //% end.defl=100
    //% amount.defl=0.5
    export function lerp(start: number, end: number, amount: number): number {
        // Clamp amount between 0 and 1 to prevent "overshooting"
        amount = Math.max(0, Math.min(1, amount));
        return start + (end - start) * amount;
    }

    //% blockId="lerp_radians_block"
    //% group="Utility"
    //% block="lerp radians $start to $end by $amount"
    //% amount.defl=0.5
    export function lerpRadians(start: number, end: number, amount: number): number {
        let diff = (end - start + Math.PI) % (2 * Math.PI);
        if (diff < 0) diff += 2 * Math.PI;
        let delta = diff - Math.PI;
        return start + delta * amount;
    }

    //% block="$val as array"
    //% group="Utility"
    export function asArray(val: any): any[] {
        return val as any[];
    }

    //% block="$val as number"
    //% group="Utility"
    export function asNumber(val: any): number {
        return val as number;
    }

    //% block="$val as image"
    //% group="Utility"
    export function asImage(val: any): Image {
        return val as Image;
    }

    //% block="$val as sprite"
    //% group="Utility"
    export function asSprite(val: any): Sprite {
        return val as Sprite;
    }
}