// FirebaseSystem — Auth (Google + Anonymous) and Firestore sync
// Uses Firebase v10 ESM SDK via CDN — no bundler required.

import firebaseConfig from '../../firebase-config.js';

// ── Lazy SDK imports (only load Firebase if config looks real) ────────────
const CONFIGURED = !firebaseConfig.apiKey.startsWith('REPLACE');

let _app, _auth, _db;
let _currentUser = null;
let _authListeners = [];

async function _initSDK() {
    if (_app) return;
    const FB = 'https://www.gstatic.com/firebasejs/10.12.2';
    const [{ initializeApp }, { getAuth, onAuthStateChanged: _oac, GoogleAuthProvider,
        signInWithPopup, signInAnonymously, signOut: _signOut, linkWithPopup },
        { getFirestore, doc, setDoc, getDoc, collection, query, orderBy,
          limit, getDocs, serverTimestamp }] = await Promise.all([
        import(`${FB}/firebase-app.js`),
        import(`${FB}/firebase-auth.js`),
        import(`${FB}/firebase-firestore.js`),
    ]);

    _app  = initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db   = getFirestore(_app);

    // Cache Firestore helpers on the module so other methods can use them
    FirebaseSystem._sdk = {
        doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, serverTimestamp,
        GoogleAuthProvider, signInWithPopup, signInAnonymously, _signOut, linkWithPopup,
    };

    _oac(_auth, (user) => {
        _currentUser = user;
        _authListeners.forEach(fn => fn(user));
    });
}

const FirebaseSystem = {
    _sdk: null,
    isConfigured: CONFIGURED,

    // ── Init ───────────────────────────────────────────────────────────────
    async init() {
        if (!CONFIGURED) {
            console.warn('[FirebaseSystem] firebase-config.js has placeholder values — running in offline mode.');
            return false;
        }
        try {
            await _initSDK();
            return true;
        } catch (e) {
            console.error('[FirebaseSystem] init failed:', e);
            return false;
        }
    },

    // ── Auth ───────────────────────────────────────────────────────────────
    currentUser() { return _currentUser; },
    isSignedIn()  { return !!_currentUser && !_currentUser.isAnonymous; },
    isAnonymous() { return !!_currentUser?.isAnonymous; },
    uid()         { return _currentUser?.uid ?? null; },
    displayName() { return _currentUser?.displayName ?? null; },
    photoURL()    { return _currentUser?.photoURL ?? null; },

    onAuthChange(fn) { _authListeners.push(fn); },

    async signInWithGoogle() {
        if (!_auth) await _initSDK();
        const { GoogleAuthProvider, signInWithPopup, linkWithPopup } = FirebaseSystem._sdk;
        const provider = new GoogleAuthProvider();
        try {
            if (_currentUser?.isAnonymous) {
                // Upgrade anonymous account → link to Google
                const result = await linkWithPopup(_currentUser, provider);
                return result.user;
            }
            const result = await signInWithPopup(_auth, provider);
            return result.user;
        } catch (e) {
            if (e.code === 'auth/credential-already-in-use') {
                // Account already exists — sign in normally
                const result = await signInWithPopup(_auth, provider);
                return result.user;
            }
            throw e;
        }
    },

    async signInAnonymously() {
        if (!_auth) await _initSDK();
        const { signInAnonymously } = FirebaseSystem._sdk;
        const result = await signInAnonymously(_auth);
        return result.user;
    },

    async signOut() {
        if (!_auth) return;
        const { _signOut } = FirebaseSystem._sdk;
        await _signOut(_auth);
        _currentUser = null;
    },

    // ── Firestore: player progress ────────────────────────────────────────
    async saveProgress(saveData) {
        if (!_currentUser || !_db) return;
        const { doc, setDoc, serverTimestamp } = FirebaseSystem._sdk;
        const uid = _currentUser.uid;
        try {
            await setDoc(doc(_db, 'users', uid), {
                profile:      saveData.profile,
                progress:     this._serializeProgress(saveData.progress),
                achievements: saveData.achievements || [],
                updatedAt:    serverTimestamp(),
            }, { merge: true });
        } catch (e) {
            console.warn('[FirebaseSystem] saveProgress failed:', e.message);
        }
    },

    async loadProgress() {
        if (!_currentUser || !_db) return null;
        const { doc, getDoc } = FirebaseSystem._sdk;
        try {
            const snap = await getDoc(doc(_db, 'users', _currentUser.uid));
            if (!snap.exists()) return null;
            return snap.data();
        } catch (e) {
            console.warn('[FirebaseSystem] loadProgress failed:', e.message);
            return null;
        }
    },

    // ── Firestore: leaderboard ────────────────────────────────────────────
    async updateLeaderboard(profile, progress) {
        if (!_currentUser || !_db || _currentUser.isAnonymous) return;
        const { doc, setDoc, serverTimestamp } = FirebaseSystem._sdk;
        try {
            await setDoc(doc(_db, 'leaderboard', _currentUser.uid), {
                uid:           _currentUser.uid,
                name:          profile.name || 'Mage',
                avatarId:      profile.avatarId ?? 0,
                xp:            progress.xp || 0,
                level:         progress.level || 1,
                wordsCount:    (progress.wordsmastered || []).length,
                battlesWon:    progress.battlesWon || 0,
                lastPlayed:    serverTimestamp(),
            }, { merge: false });
        } catch (e) {
            console.warn('[FirebaseSystem] updateLeaderboard failed:', e.message);
        }
    },

    async getLeaderboard(limitCount = 20) {
        if (!_db) return [];
        const { collection, query, orderBy, limit, getDocs } = FirebaseSystem._sdk;
        try {
            const q = query(
                collection(_db, 'leaderboard'),
                orderBy('xp', 'desc'),
                limit(limitCount)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data());
        } catch (e) {
            console.warn('[FirebaseSystem] getLeaderboard failed:', e.message);
            return [];
        }
    },

    // ── Helpers ───────────────────────────────────────────────────────────
    _serializeProgress(progress) {
        // Firestore doesn't support nested arrays cleanly — flatten where needed
        return {
            xp:            progress.xp || 0,
            level:         progress.level || 1,
            wordsmastered: progress.wordsmastered || [],
            zonesUnlocked: progress.zonesUnlocked || [0],
            levelsComplete:progress.levelsComplete || {},
            battlesWon:    progress.battlesWon || 0,
            totalPlayTime: progress.totalPlayTime || 0,
        };
    },
};

export default FirebaseSystem;
