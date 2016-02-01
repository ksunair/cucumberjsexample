Feature: Access a non-existing resource
  As a GitHub API client
  I want a 404 response for a non-existing resource
  to know that I have failed

  Scenario: Get the a non-existing resource
    When I GET a non-existing resource
    Then the http status should be 404
    And the message should equal "Not Found"
    And the documentation_url should equal "https://developer.github.com/v3"
