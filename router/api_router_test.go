package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestSetApiRouterRegistersNewFrontendRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testCases := []struct {
		name               string
		method             string
		target             string
		body               string
		unexpectedStatuses []int
	}{
		{
			name:               "waffo pancake amount route is registered behind user auth",
			method:             http.MethodPost,
			target:             "/api/user/waffo-pancake/amount",
			body:               `{"amount":10}`,
			unexpectedStatuses: []int{http.StatusNotFound},
		},
		{
			name:               "waffo pancake pay route is registered behind user auth",
			method:             http.MethodPost,
			target:             "/api/user/waffo-pancake/pay",
			body:               `{"amount":10}`,
			unexpectedStatuses: []int{http.StatusNotFound},
		},
		{
			name:               "waffo pancake webhook route is registered",
			method:             http.MethodPost,
			target:             "/api/waffo-pancake/webhook",
			body:               `{}`,
			unexpectedStatuses: []int{http.StatusNotFound},
		},
		{
			name:               "group route accepts no trailing slash without redirect",
			method:             http.MethodGet,
			target:             "/api/group",
			unexpectedStatuses: []int{http.StatusMovedPermanently, http.StatusTemporaryRedirect, http.StatusNotFound},
		},
		{
			name:               "prefill group route accepts no trailing slash without redirect",
			method:             http.MethodGet,
			target:             "/api/prefill_group",
			unexpectedStatuses: []int{http.StatusMovedPermanently, http.StatusTemporaryRedirect, http.StatusNotFound},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.Use(sessions.Sessions("session", cookie.NewStore([]byte("test-secret"))))
			SetApiRouter(router)

			req := httptest.NewRequest(tc.method, tc.target, strings.NewReader(tc.body))
			req.Header.Set("Content-Type", "application/json")
			recorder := httptest.NewRecorder()

			router.ServeHTTP(recorder, req)

			for _, status := range tc.unexpectedStatuses {
				require.NotEqual(t, status, recorder.Code)
			}
		})
	}
}
