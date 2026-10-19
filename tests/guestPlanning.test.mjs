import test from 'node:test';
import assert from 'node:assert/strict';
import {eventPhase,responseNote} from '../src/guestPlanning.js';
test('event phase follows the event timezone across midnight',()=>{const e={date:'2027-06-20',timezone:'Europe/Berlin'};assert.equal(eventPhase(e,new Date('2027-06-19T20:00:00Z')),'before');assert.equal(eventPhase(e,new Date('2027-06-19T23:00:00Z')),'today');assert.equal(eventPhase(e,new Date('2027-06-20T23:00:00Z')),'after')});
test('meal details stay in the private response note and declines omit them',()=>{assert.equal(responseNote({note:'See you!',meal:'Vegan',allergies:'Nuts'}),'Meal preference: Vegan\nAllergies / dietary needs: Nuts\nSee you!');assert.equal(responseNote({note:'Sorry',meal:'Vegan',allergies:'Nuts',attending:false}),'Sorry')});
