exports.login = async function(firebase, admin, req, resp) {
  const userData = await firebaseLogin(firebase, req.body);
  const fullInfo = await getFullUserInfo(admin, req.body.userType, userData.uid);
  resp.send(fullInfo);// TODO: returning too much data
};

async function firebaseLogin(firebase, data) {
  return await firebase.default.auth().signInWithEmailAndPassword(data.email, data.password)
      .then((response) => {
        return response.user;
      })
      .catch((error) => {
        return error;
      });
}

async function getFullUserInfo(admin, userType, uid) {
  const fullinfo = await admin.database().ref(`Users/${userType}/${uid}`)
    .once('value').then((response) => {
      const userInfo = response.val();
      userInfo.payments = undefined;
      userInfo.transactions = undefined;
      return userInfo;
    });
  return fullinfo;
}
