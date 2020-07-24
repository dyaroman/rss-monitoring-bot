# RuTrackerRssMonitoringBot

[![Publish to Registry](https://github.com/dyaroman/rss-monitoring-bot/workflows/Publish%20to%20Registry/badge.svg)](https://github.com/dyaroman/rss-monitoring-bot/actions?query=workflow%3A%22Publish+to+Registry%22)

## how to release a new version

1. create a new tag and push
2. action "Publish to Registry" will trigger and build a new docker image and publish it to docker registry
3. go to the server which host bot
4. update image version in `docker-compose.yml`
5. restart docker container by `[sudo] docker-compose up -d --force-recreate`
