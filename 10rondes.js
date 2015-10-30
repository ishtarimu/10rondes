Texte = new Mongo.Collection ("texte");
Rondes = new Mongo.Collection ("rondes");
LastWord = new Mongo.Collection ("lastword");

if (Meteor.isClient) {
  
  Meteor.subscribe("texte");
  Meteor.subscribe("lastword");
  
  Session.setDefault("mine", false)

  Template.body.helpers({
	loop: function(i){
		var tab = [];
		for (var k=1; k<i; k++){
			tab.push({value: k});
		}
		return tab;
	},
    displayTexte: function () {
		var theText = Texte.find();
		return theText;
    },
	
	lastOfTheLastWord: function () {
		var theWord = LastWord.findOne();
		return theWord && theWord.value;
	},
	
	nbOfRondes: function () {
		var theWord = LastWord.findOne();
		return theWord && theWord.nbRondes;
	}
  });
  
  Template.participate.helpers({
		editionBlocked: function () {
			var theWord = LastWord.findOne();
			if (Session.get("mine")){
				return false;
			}
			return theWord && theWord.blocked;
		},
		
		isMine: function () {
			if (Session.get("mine")){
				return true;
			}
			return false;
		}
  });
  
  Template.participate.events({
	"submit form": function(event) {
		event.preventDefault();
		var txt = event.target.pTexte.value;
		event.target.pTexte.value = "";
		Meteor.call("participation", txt);
		Session.set("mine", false);
		Meteor.call("unblock");
	},
	
	"focus .participate-area ": function(event) {
		event.preventDefault();
		Session.set("mine", true);
		Meteor.call("block");
	}
	
  });

}


if (Meteor.isServer) {
	
	Meteor.startup(function () {
		
		LastWord.insert({
			value: "A vous de commencer !",
			nbRondes: 0,
			blocked: false
		});
		
		Meteor.publish("texte", function () {
			return Texte.find();
		});
		Meteor.publish("lastword", function () {
			return LastWord.find();
		});
		
		Meteor.methods({
			participation: function (text) {
				if (/\S/.test(text)) {
					var wordTab = text.split(" ");
					var lastWord = wordTab[wordTab.length - 1];
					var nbOfRondes = Rondes.find({}).count();
					if (nbOfRondes > 1){
						Rondes.update({last: true},{ $set:{last: false} });
					}
					
					Rondes.insert({
						value: text,
						last: true
					});
					
					LastWord.update({}, { $set:{value: lastWord, nbRondes: nbOfRondes+1}});
					
					if (nbOfRondes > 9) {
						var firstRonde = Rondes.findOne({});
						Rondes.remove(firstRonde._id);
						Texte.insert({
							value: firstRonde.value
						});
					}
				}
			},
			
			block: function () {
				LastWord.update({}, { $set:{blocked: true}});
				Meteor.setTimeout( function () {
					LastWord.update({}, { $set:{blocked: false}});
				}, 600000)
			},		
			unblock: function () {
				LastWord.update({}, { $set:{blocked: false}});
			}
		});
	});
}
