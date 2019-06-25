import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { darken } from '@material-ui/core/styles/colorManipulator';
import AppRouter, { RouterContext } from 'components/Router';
import { WithStyles } from 'decorators/withStyles';
import { IAppRoute } from 'interfaces/route';
import { IUserToken } from 'interfaces/userToken';
import ExpandMoreIcon from 'mdi-react/ExpandMoreIcon';
import React, { Fragment, PureComponent } from 'react';
import rxjsOperators from 'rxjs-operators';

import { IAppRouteParsed } from './routeParser';

interface IState {
  expanded: boolean;
  active: boolean;
}

interface IProps {
  user: IUserToken;
  route: IAppRouteParsed;
  onClick: (route: IAppRoute) => void;
  classes?: any;
}

@WithStyles(theme => ({
  item: {
    paddingLeft: 14,
    opacity: 0.8,
    '&.active': {
      opacity: 1,
      background: darken(theme.palette.primary.main, 0.30)
    }
  },
  icon: {
    margin: '0',
    fill: theme.palette.primary.contrastText
  },
  text: {
    color: 'inherit'
  },
  expandablePanel: {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    marginLeft: -10,
    boxShadow: 'none',
    margin: 0,
    '&.active': {
      background: darken(theme.palette.primary.main, 0.10)
    }
  },
  expandableTitle: {
    '&:hover': {
      background: darken(theme.palette.primary.main, 0.10)
    }
  },
  expandableDetails: {
    padding: 0
  },
  innerList: {
    padding: 0,
    width: '100%',
    '& > div': {
      paddingLeft: 40
    }
  }
}))
export default class DrawerListItem extends PureComponent<IProps, IState> {
  getRouter: () => AppRouter;

  constructor(props: IProps) {
    super(props);
    this.state = { expanded: false, active: false };
  }

  componentDidMount() {
    this.getRouter().observeChange().pipe(
      rxjsOperators.logError(),
      rxjsOperators.bindComponent(this)
    ).subscribe(location => {
      const { route } = this.props;

      const active = route.exact ?
        location.pathname === route.path :
        location.pathname.startsWith(route.path);

      this.setState({ active, expanded: active });
    });
  }

  handleClick = () => {
    this.props.onClick(this.props.route);
  }

  handleSubClick = (route: IAppRouteParsed) => {
    this.props.onClick(route);
  }

  handleExandedClick = (event: any, expanded: boolean) => {
    this.setState({ expanded });
  }

  canAccess = () => {
    const { route, user } = this.props;

    if (route.allowAnonymous) return true;
    if (!user) return false;
    if (!route.roles) return true;

    return user.canAccess(...route.roles);
  }

  render() {
    const { route } = this.props;

    return (
      <Fragment>
        <RouterContext.Consumer>
          {getRouter => (this.getRouter = getRouter) && null}
        </RouterContext.Consumer>

        {
          this.canAccess() && (
            !route.subRoutes.length ?
              this.renderSingle() :
              this.renderList()
          )
        }
      </Fragment>
    );
  }

  renderSingle = () => {
    const { active } = this.state;
    const { route, classes } = this.props;

    return (
      <ListItem
        button
        disableGutters
        className={`${classes.item} ${active ? 'active' : ''}`}
        onClick={this.handleClick}
      >
        {!!route.sideDrawer.icon &&
          <ListItemIcon className={classes.icon} classes={{ root: classes.text }}>
            <route.sideDrawer.icon />
          </ListItemIcon>
        }
        <ListItemText primary={route.sideDrawer.display} classes={{ primary: classes.text }} />
      </ListItem>
    );
  }

  renderList = (): React.ReactNode => {
    const { expanded } = this.state;
    const { route, classes, user } = this.props;

    return (
      <ExpansionPanel
        expanded={expanded}
        onChange={this.handleExandedClick}
        className={`${classes.expandablePanel} ${expanded ? 'active' : ''}`}
      >
        <ExpansionPanelSummary className={classes.expandableTitle} expandIcon={<ExpandMoreIcon className={classes.icon} />}>
          {!!route.sideDrawer.icon &&
            <ListItemIcon className={classes.icon} classes={{ root: classes.text }}>
              <route.sideDrawer.icon />
            </ListItemIcon>
          }
          <ListItemText primary={route.sideDrawer.display} classes={{ primary: classes.text }} />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.expandableDetails}>
          <List className={classes.innerList}>
            {route.subRoutes.map(sub =>
              <DrawerListItem key={sub.path} user={user} route={sub} classes={classes} onClick={this.handleSubClick} />
            )}
          </List>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}