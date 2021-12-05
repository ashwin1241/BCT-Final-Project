App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      //App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  // listenForEvents: function() {
  //   App.contracts.Election.deployed().then(function(instance) {
  //     // Restart Chrome if you are unable to receive this event
  //     // This is a known issue with Metamask
  //     // https://github.com/MetaMask/metamask-extension/issues/2393
  //     instance.votedEvent({}, {
  //       fromBlock: 0,
  //       toBlock: 'latest'
  //     }).watch(function(error, event) {
  //       console.log("event triggered", event)
  //       // Reload when a new vote is recorded
  //       App.render();
  //     });
  //   });
  // },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    var voteCastingStatus = $("#voteCastingStatus");
    var currentUser;
    var total_votes=1;
    

    loader.show();
    content.hide();
    voteCastingStatus.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        currentUser = account;
        $("#accountAddress").html("<font size=4>Your Account:&emsp;</font><font size=4.5><b>" + account+"</b></font>");
      }
    });
    
    var isUserOwner;

    App.contracts.Election.deployed().then(function(instance){
      return instance.isOwner(currentUser,{from: App.account});
    }).then(function(isUserOwner){
      if(isUserOwner)
      {
        $("#addCandidateForm").show();
      }
      else
      {
        $("#addCandidateForm").hide();
      }
    }).catch(function(err) {
      console.error(err);
    });

    App.contracts.Election.deployed().then(function(instance){
      return instance.returnTotalVoteCount({from: App.account});
    }).then(function(result){
      total_votes = result;
    }).catch(function(err) {
      console.error(err);
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.no_of_candidates();
    }).then(function(no_of_candidates) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();
      
      for (var i = 1; i <= no_of_candidates; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];
          var percentage = (voteCount/total_votes)*100;

          // Render candidate Result
          var candidateTemplate = "<tr><td><center>" + id + "</center></td><td><center>" + name + "</center></td><th><font color=red>" + voteCount + "</font></th><th><font color=red>"+percentage.toFixed(3)+" %</font></th></tr>";
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(currentUser);
    }).then(function(hasVoted) {
      // Do not allow a user to recast vote
      if(hasVoted) {
        $('form').hide();
        voteCastingStatus.show();
        
        App.contracts.Election.deployed().then(function(instance){
            return instance.returnCandidate(currentUser, {from: App.account});
        }).then(function(result){
          $("#successMessage").append(result);
        }).catch(function(err) {
          console.error(err);
        });
      }
      
      if(!hasVoted)
      {
        $('form').show();
        voteCastingStatus.hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      location.reload()
      // $("#content").hide();
      // $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },
  _addCandidate: function() {
    var name = $('#candidate_name1').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addCandidate(name, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      // $("#content").hide();
      // $("#loader").show();
      location.reload()
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});