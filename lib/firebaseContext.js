// This file sets up the Firebase Context to provide user data and Firestore listeners.
import { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, query, where, getDocs, getDoc, setDoc, collectionGroup } from 'firebase/firestore';
import db, { auth } from './firebase';

const FirebaseContext = createContext(null);
export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [inactivity, setInactivity] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [allHistory, setAllHistory] = useState([]);
    const [allDepositReq, setAllDepositReq] = useState([]);
    const [allWithdrawReq, setAllWithdrawReq] = useState([]);
    const [allInvestments, setAllInvestments] = useState([]);
    const [kycRequests, setKycRequests] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [managePlans, setManagePlans] = useState([]);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    setUserId(user.uid);
                    setUserToken(token);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Error getting user token:", error);
                    setUserId(null);
                    setIsAuthenticated(false);
                }
            } else {
                setUserId(null);
                setIsAuthenticated(false);
            }
        });

        let logoutTimer;

        const startLogoutTimer = () => {
            logoutTimer = setTimeout(() => {
                logoutUser();
            }, 30 * 60 * 1000);
        };

        const resetLogoutTimer = () => {
            clearTimeout(logoutTimer);
            startLogoutTimer();
        };

        if (userId) {
            startLogoutTimer();
        }

        const handleUserActivity = () => {
            resetLogoutTimer();
        };

        document.addEventListener('mousemove', handleUserActivity);
        document.addEventListener('keydown', handleUserActivity);

        return () => {
            clearTimeout(logoutTimer);
            unsubscribeAuth();
            document.removeEventListener('mousemove', handleUserActivity);
            document.removeEventListener('keydown', handleUserActivity);
        };
    }, [userId]);

    const logoutUser = () => {
        auth.signOut().then(() => {
            setInactivity(true);
            setIsAuthenticated(false);
            setTimeout(() => {
                setInactivity(false);
            }, 3000);
        }).catch((error) => {
            console.error("Error logging out:", error);
        });
    };

    useEffect(() => {
        if (userId) {
            // FETCH ALL USERS (keep original)
            const unsubscribeSnapshot1 = onSnapshot(
                collection(db, "USERS"),
                (snapshot) => {
                  const usersData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                  setAllUsers(usersData);
                },
                (error) => {
                  console.error("Error fetching all users:", error);
                }
            );

            // FETCH ALL TRANSACTIONS (keep original)
            const unsubscribeSnapshot2 = onSnapshot(
                collection(db, "ALLHISTORY"),
                (snapshot) => {
                    const historyArray = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    }));
                    setAllHistory(historyArray);
                },
                (error) => {
                    console.error("Error fetching ALLHISTORY:", error);
                }
            );

            // FETCH DEPOSIT REQUESTS - REPLACED WITH API CALL
            const fetchDepositRequests = async () => {
                try {
                    const response = await fetch('/api/admin/depositRequests');
                    if (response.ok) {
                        const depositData = await response.json();
                        setAllDepositReq(depositData);
                    }
                } catch (error) {
                    console.error('Error fetching deposit requests:', error);
                }
            };
            fetchDepositRequests();
            const depositInterval = setInterval(fetchDepositRequests, 3000);

            // FETCH ALL WITHDRAWAL TRANSACTIONS (keep original)
            const unsubscribeSnapshot4 = onSnapshot(
                collection(db, "WITHDRAWREQUEST"),
                (snapshot) => {
                    const withdrawalArray = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    }));
                    setAllWithdrawReq(withdrawalArray);
                },
                (error) => {
                    console.error("Error fetching WITHDRAWREQUEST:", error);
                }
            );

            // FETCH ALL INVESTMENT DATA (keep original)
            const unsubscribeSnapshot5 = onSnapshot(
                collection(db, "INVESTMENT"),
                (snapshot) => {
                    const investmentArray = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    }));
                    setAllInvestments(investmentArray);
                },
                (error) => {
                    console.error("Error fetching INVESTMENT:", error);
                }
            );

            // KYC REQUESTS (keep original)
            const unsubscribeSnapshot6 = onSnapshot(
                collection(db, "CUSTOMERKYC"),
                (querySnapshot) => {
                    const requests = [];
                    querySnapshot.forEach((docSnapshot) => {
                    requests.push({ id: docSnapshot.id, ...docSnapshot.data() });
                    });
                    setKycRequests(requests);
                },
                (error) => {
                    console.error("Error fetching KYC requests:", error);
                }
            );

            // SUPPORT TICKETS (keep original)
            const unsubscribeSnapshot7 = onSnapshot(
                collection(db, "CUSTOMERTICKETS"),
                (querySnapshot) => {
                    const tickets = [];
                    querySnapshot.forEach((docSnapshot) => {
                    tickets.push({ id: docSnapshot.id, ...docSnapshot.data() });
                    });
                    setSupportTickets(tickets);
                },
                (error) => {
                    console.error("Error fetching support tickets:", error);
                }
            );

            // MANAGE PLANS (keep original)
            const unsubscribeSnapshot8 = onSnapshot(
                collection(db, "MANAGE_PLAN"),
                (querySnapshot) => {
                    const plans = [];
                    querySnapshot.forEach((docSnapshot) => {
                    plans.push({ id: docSnapshot.id, ...docSnapshot.data() });
                    });
                    setManagePlans(plans);
                },
                (error) => {
                    console.error("Error fetching manage plans:", error);
                }
            );

            return () => {
                unsubscribeSnapshot1();
                unsubscribeSnapshot2();
                clearInterval(depositInterval); // Clear the interval
                unsubscribeSnapshot4();
                unsubscribeSnapshot5();
                unsubscribeSnapshot6();
                unsubscribeSnapshot7();
                unsubscribeSnapshot8();
            };
        }
    }, [userId]);

    return (
      <FirebaseContext.Provider
        value={{
          userToken,
          inactivity,
          isAuthenticated,
          allUsers,
          allHistory,
          allDepositReq,
          allWithdrawReq,
          allInvestments,
          kycRequests,
          supportTickets,
          managePlans,
          setAllUsers,
          setAllHistory,
          setAllDepositReq,
          setAllWithdrawReq,
          setAllInvestments,
          setKycRequests,
          setSupportTickets,
          setManagePlans,
        }}
      >
        {children}
      </FirebaseContext.Provider>
    );
};