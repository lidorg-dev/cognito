
// @ts-nocheck
import AWS from 'aws-sdk' 

document.getElementById('load-unauthenticated-button').addEventListener('click', loadFunctions)
document.getElementById('load-authenticated-button').addEventListener('click', ()=>loadFunctions(JSON.parse(localStorage.getItem('google-auth-response'))))



function loadFunctions(authResult) {
  var token = authResult && authResult['id_token']
 console.log('toen',token)
  AWS.config.region = 'us-east-1';
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'us-east-1:b544f76b-6810-4412-a262-1defad430e81',
      Logins: {
          'accounts.google.com': token,
        //   'cognito-idp.<region>.amazonaws.com/<YOUR_USER_POOL_ID>':token
      }
  });

  // obtain credentials
  AWS.config.credentials.get(function (err) {
      if (!err) {
          var lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });
          lambda.listFunctions({}, function (err, data) {
              if (err) {
                  document.getElementById('lambda-function-list').innerHTML = JSON.stringify(err);
              }
              else {
                  setFunctionList(data.Functions)
              }
          });
      } else {
          document.getElementById('lambda-function-list').innerHTML = JSON.stringify(err)
      }
  });
}
function setFunctionList(functions = []) {
  var createCardText = function (name, value) {
      var cardtext = document.createElement("p");
      cardtext.classList.add('card-text');
      cardtext.innerHTML = `${name} <b>${value}</b> <br>`
      return cardtext;
  }
  document.getElementById('lambda-function-list').innerHTML = '';
  functions.forEach((item) => {

      var card = document.createElement("DIV");
      card.classList.add('card')
      card.style.maxWidth = '250px'
      card.style.minWidth = '250px'
      card.style.marginRight = '20px'
      card.style.marginBottom = '10px'

      var cardimage = document.createElement("img")
      cardimage.style.height = '150px';
      cardimage.style.width = '250px';

      cardimage.classList.add('card-img-top')
      cardimage.src = "https://www.gliffy.com/hubfs/AWS-Lambda_dark-bg.svg"
      card.appendChild(cardimage);

      var cardbody = document.createElement("DIV");
      cardbody.classList.add('card-body');
      card.append(cardbody)


      cardbody.appendChild(createCardText("Name", item.FunctionName))
      cardbody.appendChild(createCardText("Description", item.Description))
      cardbody.appendChild(createCardText("LastModified", item.LastModified))
      cardbody.appendChild(createCardText("FunctionArn", item.FunctionArn))
      cardbody.appendChild(createCardText("CodeSize", item.CodeSize))


      document.getElementById('lambda-function-list').appendChild(card)

  })


}
 