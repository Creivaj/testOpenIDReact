

export default function Register() {
  return (
    <div>
      registrate oye...
    </div>
  )
}

import { useContext } from "react"
import ReactDOM from "react-dom"
import { AuthContext, AuthProvider, IAuthContext, TAuthConfig, TRefreshTokenExpiredEvent } from "react-oauth2-code-pkce"
/**
 *Clientes en KeyCloack: clientesoloopenid,openidpkce.
 */
const authConfig: TAuthConfig = {
  clientId: 'openidpkce',
  authorizationEndpoint: 'https://test.keycloak.org.apps.odmdv.claro.pe/realms/soloopenid/protocol/openid-connect/auth',
  tokenEndpoint: 'https://test.keycloak.org.apps.odmdv.claro.pe/realms/soloopenid/protocol/openid-connect/token',
  redirectUri: 'http://localhost:5173/auth/login',
  scope: 'openid',
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => event.logIn(undefined, undefined, "popup"),
}



const UserInfo = (): JSX.Element => {
    const {token, tokenData} = useContext<IAuthContext>(AuthContext)

    return <>
        <h4>Access Token</h4>
        <pre>{token}</pre>
        <h4>User Information from JWT</h4>
        <pre>{JSON.stringify(tokenData, null, 2)}</pre>
    </>
}

ReactDOM.render(<AuthProvider authConfig={authConfig}>
        <UserInfo/>
    </AuthProvider>
    , document.getElementById('root'),
)
