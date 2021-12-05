pragma solidity >= 0.4.11;

contract Election {
    
    address deployed;
    address owner;
    uint totalVoteCount = 0;
    // Schema of Candidate class
    struct Candidate {
        uint candidate_id;
        string candidate_name;
        uint candidate_no_of_votes;
    }

    mapping(address => bool) public voters;           //map to keep track of voters who already voted
    mapping(uint => Candidate) public candidates;     //to access candidates using index
    mapping(address => uint) public voter_candidate;  //to map voter to voted candidate

    uint public no_of_candidates = 0;

    constructor() public {
        owner = msg.sender;
        addCandidate("Drake");
        addCandidate("Hobbs");
        addCandidate("Josh");
        addCandidate("Shaw");
    }

    function addCandidate (string memory _name) public {
        no_of_candidates ++;
        candidates[no_of_candidates] = Candidate(no_of_candidates, _name, 0);
    }

    function vote (uint _candidateId) public {
        
        require(!voters[msg.sender]);

        
        require(_candidateId > 0 && _candidateId <= no_of_candidates);

       
        voters[msg.sender] = true;
        voter_candidate[msg.sender] = _candidateId;


        candidates[_candidateId].candidate_no_of_votes ++;
        totalVoteCount++;

    }

    function returnCandidate (address voter_address) public view returns (string memory){
        return candidates[voter_candidate[voter_address]].candidate_name;
    }

    function returnTotalVoteCount () public view returns (uint) {
        return totalVoteCount;
    }

    function isOwner (address user) public view returns (bool)
    {
        if(user==owner)
        return true;
        else
        return false;
    }
}
