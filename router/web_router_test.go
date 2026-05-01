package router

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestIsCacheableStaticAssetPath(t *testing.T) {
	testCases := []struct {
		name     string
		path     string
		expected bool
	}{
		{name: "root page is still rate limited", path: "/", expected: false},
		{name: "route page is still rate limited", path: "/dashboard", expected: false},
		{name: "static async chunk is skipped", path: "/static/js/async/3816.4867087d1b.js", expected: true},
		{name: "asset path is skipped", path: "/assets/index.css", expected: true},
		{name: "favicon is skipped", path: "/favicon.ico", expected: true},
		{name: "avatar image is skipped", path: "/avatars/01.png", expected: true},
		{name: "font file is skipped", path: "/fonts/PublicSans.woff2", expected: true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.expected, isCacheableStaticAssetPath(tc.path))
		})
	}
}
