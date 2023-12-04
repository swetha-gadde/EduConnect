
App = {
  web3: null,
  contracts: {},
  addressEdu: "0x340A71ac6Df7Be760cA853767dAE0B7412015691",
  names: new Array(),
  url: "http://127.0.0.1:7545",
  // chairPerson: null,
  // currentAccount: null,
  
  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      App.web3 = new Web3(Web3.givenProvider);
    } else {
      App.web3 = new Web3(App.url);
    }
    ethereum.request({ method: "eth_requestAccounts" });

    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    //App.contracts.Ballot = new App.web3.eth.Contract(App.abi, App.address, {});
    App.contracts.EducationPlatform = new App.web3.eth.Contract(App.abiEdu, App.addressEdu, {});
    //App.contracts.EduToken = new App.web3.eth.Contract(App.abiEduToken, App.addressEduToken, {});
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", "#registerStudent", function() {
      App.registerAs(0); // 0 for student
  });

    $(document).on("click", "#registerInstructor", function() {
      App.registerAs(1); // 1 for instructor
  });
  $(document).on("click", "#subscribe-button", App.handleSubscribe);
  $(document).on("click", "#issue-certificate-button", App.issueCertificate);
  $(document).on("click", "#rate-instructor-button", App.instructorRating);
  $(document).on("click", "#display-ratings-button", App.displayInstructorRating);
  $(document).on("click", "#apply-for-job-button", App.jobApplication);
  $(document).on("click", "#display-balance-button", App.displayBalance);
  $(document).on("click", "#retrieve-resume", App.retrieveResume);
  },

  retrieveResume: function() {
    console.log("Resume retrieval sucessful");
    var option = { from: App.handler };
    App.contracts.EducationPlatform.methods
      .getCertifcate()
      .send(option)
      .on("receipt", (receipt) => {
        toastr.success("Successful Resume retrieval!");
      })
      .on("error", (err) => {
        toastr.error(App.getErrorMessage(err), "Reverted!");
      });
},

  issueCertificate: function() {
    const studentAddress = $('#student-address').val().trim();
    
    if (!studentAddress) {
        alert("Please enter the student's address.");
        return;
    }

    var option = { from: App.handler };
    App.contracts.EducationPlatform.methods
      .awardCertificate(studentAddress)
      .send(option)
      .on("receipt", function(receipt) {
        // Find the CertificateMinted event in the receipt
        const certificateMintedEvent = receipt.events.CertificateMinted;
        if (certificateMintedEvent) {
            const tokenId = certificateMintedEvent.returnValues.tokenId;
            console.log("Minted Certificate Token ID: ", tokenId);
        }
        toastr.success("Certificate awarded successfully");
      })
      .on("error", function(err) {
        console.error("Error in awarding certificate: ", err);
        toastr.error(App.getErrorMessage(err), "Error in awarding Certificate");
      });
},
  jobApplication: function(){
      // console.log("Registered as: " + (role === 0 ? "Student" : "Instructor"));
      // // Add your registration logic here
      const applicationFee = $('#applyFee').val().trim();
      const employerAddress = $('#employerAddress').val().trim();
      if (!applicationFee) {
        alert("Please enter Fee.");
        return;
      }
      if (!employerAddress) {
        alert("Please enter Employer Address.");
        return;
      }
      var option = { from: App.handler };
      App.contracts.EducationPlatform.methods
        .applyForJob(employerAddress,applicationFee)
        .send(option)
        .on("receipt", (receipt) => {
          toastr.success("Application Successfull!");
        })
        .on("error", (err) => {
          toastr.error(App.getErrorMessage(err), "Error in application!");
        });
  },

  displayBalance: function() {
    console.log("I am here");
    App.contracts.EducationPlatform.methods.getBalances().call({ from: App.handler })
      .then(function(result) {
        console.log("Ratings result:", result);
        const EduTokenBalance = (result[0]/=10**18).toString();
        const NFTBalance = result[1].toString();
        const ratingsTableBody = $('#ratings-table-body2');
        ratingsTableBody.empty();
        console.log("Reached Here")
        let row=`<tr>
            <td>${EduTokenBalance}</td>
            <td>${NFTBalance}</td>
          </tr>`;
          ratingsTableBody.append(row);
      })
      .catch(function(err) {
        console.error("Error fetching instructor ratings: ", err);
      });
  },  

  displayInstructorRating: function() {
    App.contracts.EducationPlatform.methods.viewRatings().call()
      .then(function(result) {
        console.log("Ratings result:", result);
        const instructors = result[0];
        const names = result[1];
        const ratings = result[2];
        const ratingsTableBody = $('#ratings-table-body');
        ratingsTableBody.empty(); // Clear existing rows
  
        for (let i = 0; i < instructors.length; i++) {
          let row = `<tr>
                      <td>${instructors[i]}</td>
                      <td>${names[i]}</td>
                      <td>${ratings[i]}</td>
                    </tr>`;
          ratingsTableBody.append(row);
        }
      })
      .catch(function(err) {
        console.error("Error fetching instructor ratings: ", err);
      });
  },  

  instructorRating: function() {  
    // Fetch the instructor's address from the input field
    const rinstructorAddress = $('#rinstructor-address').val().trim();
    const rinstructorRating = $('#rinstructor-rating').val().trim();
    if (!rinstructorAddress) {
        alert("Please enter the address of instructor you want to rate.");
        return;
    }
    if (!rinstructorRating) {
      alert("Please enter the rating between 1-5.");
      return;
    }
    var option = { from: App.handler };
    App.contracts.EducationPlatform.methods
      .rateInstructor(rinstructorAddress,rinstructorRating)
      .send(option)
      .on("receipt", (receipt) => {
        toastr.success("Rated Instructor successfully");
      })
      .on("error", (err) => {
        toastr.error(App.getErrorMessage(err), "Error in the rating process");
      });
},

  handleSubscribe: function() {
    
    // Fetch the instructor's address from the input field
    const instructorAddress = $('#instructor-address').val().trim();
    
    if (!instructorAddress) {
        alert("Please enter the instructor's address.");
        return;
    }
    var option = { from: App.handler };
    App.contracts.EducationPlatform.methods
      .subscribe(instructorAddress)
      .send(option)
      .on("receipt", (receipt) => {
        toastr.success("Subscribed successfully");
      })
      .on("error", (err) => {
        toastr.error(App.getErrorMessage(err), "Error in the subscription process");
      });
},

  registerAs: function(role) {
    console.log("Registered as: " + (role === 0 ? "Student" : "Instructor"));
    // Add your registration logic here
    const userName = $('#userFullName').val().trim();
    if (!userName) {
      alert("Please enter your Full Name.");
      return;
    }
    var option = { from: App.handler };
    App.contracts.EducationPlatform.methods
      .register(userName,role)
      .send(option)
      .on("receipt", (receipt) => {
        toastr.success("Success! Address: " + App.handler + " has been registered.");
      })
      .on("error", (err) => {
        toastr.error(App.getErrorMessage(err), "Reverted!");
      });
  },

  populateAddress: async function () {
    const userAccounts = await App.web3.eth.getAccounts();
    App.handler = userAccounts[0];
    document.getElementById("currentUserAddress").innerText =
          "Current User Address: " + App.handler;
  },

  getErrorMessage: function (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    let errorReason = "";

    if (errorCode === 4001) {
      return "User rejected the request!";
    } else if (
      errorMessage.includes("Access Denied: ")
    ) {
      return "Access Denied: ";
    } else if (errorMessage.includes("Access Denied:")) {
      return "Access Denied:";
    } else if (
      errorMessage.includes("Vote Denied: ")
    ) {
      return "Vote Denied: ";
    } else if (
      errorMessage.includes(
        "Invalid  "
      )
    ) {
      return "Invalid ";
    } 
    else if (
      errorMessage.includes(
        "Access Denied: User has been registered already!"
      )
    ) {
      return "Access Denied: User has been registered already!";
    }else {
      return "Unexpected Error!";
    }
  },

  abiEdu:
  [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_eduToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_certificate",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idsLength",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "valuesLength",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InvalidArrayLength",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC1155MissingApprovalForAll",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "TransferBatch",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "TransferSingle",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "value",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "URI",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "employer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "applicationFee",
          "type": "uint256"
        }
      ],
      "name": "applyForJob",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "student",
          "type": "address"
        }
      ],
      "name": "awardCertificate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "accounts",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        }
      ],
      "name": "balanceOfBatch",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getBalances",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCertifcate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "instructor",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "rating",
          "type": "uint256"
        }
      ],
      "name": "rateInstructor",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "Name",
          "type": "string"
        },
        {
          "internalType": "enum EducationPlatform.Role",
          "name": "role",
          "type": "uint8"
        }
      ],
      "name": "register",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "registeredInstructors",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeBatchTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "instructor",
          "type": "address"
        }
      ],
      "name": "subscribe",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "uri",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "users",
      "outputs": [
        {
          "internalType": "string",
          "name": "userName",
          "type": "string"
        },
        {
          "internalType": "enum EducationPlatform.Role",
          "name": "userRole",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "isRegistered",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "totalRating",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalRaters",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "viewRatings",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        },
        {
          "internalType": "string[]",
          "name": "",
          "type": "string[]"
        },
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
  
},

$(function () {
  $(window).load(function () {
    App.init();
    toastr.options = {
      closeButton: true,
      debug: false,
      newestOnTop: false,
      progressBar: false,
      positionClass: "toast-bottom-full-width",
      preventDuplicates: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut",
    };
  });
});

/* Detect when the account on metamask is changed */
window.ethereum.on("accountsChanged", () => {
  App.populateAddress();
});

/* Detect when the network on metamask is changed */
window.ethereum.on("chainChanged", () => {
  App.populateAddress();
});
